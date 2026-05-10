// supabase/edge-functions/mp-webhook/index.ts
// DeFatFit v7 — Edge Function: Webhook de Mercado Pago
//
// DEPLOY: supabase functions deploy mp-webhook --project-ref TU_REF
//
// CONFIGURAR EN SUPABASE > Edge Functions > Secrets:
//   MP_ACCESS_TOKEN = tu_access_token (mismo que en crear-preferencia-mp)
//
// CONFIGURAR EN MERCADO PAGO > Tu app > Webhooks:
//   URL: https://TU_REF.supabase.co/functions/v1/mp-webhook
//   Eventos a escuchar: payment
//
// FLUJO:
//   1. Usuario paga en Mercado Pago
//   2. MP llama a esta URL con los datos del pago
//   3. Esta función verifica el pago con la API de MP
//   4. Actualiza la tabla `pagos` y `suscripciones` en Supabase
//   5. El usuario queda con acceso activo automáticamente

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cliente Supabase con SERVICE_ROLE para poder escribir sin RLS
// Esta key es segura aquí porque está en el servidor, nunca en el frontend
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

serve(async (req: Request) => {
  // MP puede enviar GET para verificar que el endpoint existe
  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // ─────────────────────────────────────────
    // 1. Leer el evento que envía Mercado Pago
    // ─────────────────────────────────────────
    const body = await req.json();
    console.log("[mp-webhook] Evento recibido:", JSON.stringify(body));

    // MP puede enviar distintos tipos de eventos
    // Solo nos interesan los de tipo "payment"
    const tipo = body.type || body.topic;
    const paymentId = body.data?.id || body.id;

    if (tipo !== "payment" || !paymentId) {
      console.log("[mp-webhook] Evento ignorado:", tipo);
      return new Response("Evento ignorado", { status: 200 });
    }

    // ─────────────────────────────────────────
    // 2. Guardar el evento raw (para auditoría)
    // ─────────────────────────────────────────
    const { data: eventoExistente } = await supabaseAdmin
      .from("payment_webhook_events")
      .select("id, processed")
      .eq("provider", "mercadopago")
      .eq("event_id", String(paymentId))
      .maybeSingle();

    // Si ya lo procesamos, salir sin duplicar
    if (eventoExistente?.processed) {
      console.log("[mp-webhook] Evento ya procesado:", paymentId);
      return new Response("Ya procesado", { status: 200 });
    }

    // Insertar o actualizar el evento
    const { data: evento } = await supabaseAdmin
      .from("payment_webhook_events")
      .upsert({
        provider: "mercadopago",
        event_id: String(paymentId),
        event_type: tipo,
        payload: body,
        processed: false
      }, { onConflict: "provider,event_id" })
      .select()
      .maybeSingle();

    // ─────────────────────────────────────────
    // 3. Consultar el pago en la API de MP
    //    para obtener los datos reales y verificar
    // ─────────────────────────────────────────
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mpResponse.ok) {
      throw new Error(`Error consultando pago en MP: ${mpResponse.status}`);
    }

    const pago = await mpResponse.json();
    console.log("[mp-webhook] Estado del pago:", pago.status, "| Referencia:", pago.external_reference);

    // ─────────────────────────────────────────
    // 4. Leer external_reference para identificar
    //    el usuario y el plan
    //    Formato: "userId|planId"
    // ─────────────────────────────────────────
    const externalRef = pago.external_reference || "";
    const [userId, planId] = externalRef.split("|");

    if (!userId || !planId) {
      throw new Error(`external_reference inválido: ${externalRef}`);
    }

    // ─────────────────────────────────────────
    // 5. Procesar según el estado del pago
    // ─────────────────────────────────────────
    const estadoMP = pago.status; // approved, rejected, pending, cancelled, refunded...

    const estadoPago = _mapearEstadoPago(estadoMP);
    const pagoAprobado = estadoMP === "approved";

    // Buscar suscripción existente del usuario para ese plan
    let suscripcionId: string | null = null;

    if (pagoAprobado) {
      // Obtener duración del plan
      const { data: plan } = await supabaseAdmin
        .from("planes_suscripcion")
        .select("duracion_dias, nombre")
        .eq("id", planId)
        .maybeSingle();

      if (!plan) throw new Error(`Plan no encontrado: ${planId}`);

      const hoy = new Date();
      const termino = new Date(hoy);
      termino.setDate(termino.getDate() + plan.duracion_dias);

      // Upsert suscripción
      const { data: sub, error: subError } = await supabaseAdmin
        .from("suscripciones")
        .upsert({
          user_id: userId,
          plan_id: planId,
          estado: "activa",
          fecha_inicio: hoy.toISOString().split("T")[0],
          fecha_termino: termino.toISOString().split("T")[0],
          provider: "mercadopago",
          provider_payment_id: String(paymentId),
          metadata: { mp_status: estadoMP, mp_payment_id: paymentId },
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" })
        .select()
        .maybeSingle();

      if (subError) throw new Error(`Error creando suscripción: ${subError.message}`);
      suscripcionId = sub?.id || null;

      console.log(`[mp-webhook] ✅ Suscripción activada para usuario ${userId} — plan ${planId}`);
    }

    // ─────────────────────────────────────────
    // 6. Registrar el pago en la tabla `pagos`
    // ─────────────────────────────────────────
    await supabaseAdmin.from("pagos").upsert({
      user_id: userId,
      suscripcion_id: suscripcionId,
      provider: "mercadopago",
      provider_payment_id: String(paymentId),
      external_reference: externalRef,
      monto: pago.transaction_amount ? Math.round(pago.transaction_amount) : null,
      moneda: pago.currency_id || "CLP",
      estado: estadoPago,
      fecha_pago: pagoAprobado ? new Date().toISOString() : null,
      raw: pago,
      updated_at: new Date().toISOString()
    }, { onConflict: "provider_payment_id" });

    // ─────────────────────────────────────────
    // 7. Marcar el evento como procesado
    // ─────────────────────────────────────────
    if (evento?.id) {
      await supabaseAdmin
        .from("payment_webhook_events")
        .update({ processed: true, error: null })
        .eq("id", evento.id);
    }

    return new Response(
      JSON.stringify({ ok: true, estado: estadoMP, userId, planId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[mp-webhook] Error:", error.message);

    // Intentar marcar el evento con el error para debugging
    try {
      const body = await req.clone().json().catch(() => ({}));
      const paymentId = body?.data?.id || body?.id;
      if (paymentId) {
        await supabaseAdmin
          .from("payment_webhook_events")
          .update({ error: error.message })
          .eq("provider", "mercadopago")
          .eq("event_id", String(paymentId));
      }
    } catch (_) { /* silenciar error secundario */ }

    // Devolver 200 igual para que MP no reintente infinitamente
    // Los errores quedan registrados en payment_webhook_events
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function _mapearEstadoPago(estadoMP: string): string {
  const mapa: Record<string, string> = {
    approved:        "aprobado",
    rejected:        "rechazado",
    pending:         "pendiente",
    in_process:      "pendiente",
    cancelled:       "cancelado",
    refunded:        "reembolsado",
    charged_back:    "reembolsado",
    authorized:      "pendiente",
  };
  return mapa[estadoMP] || "pendiente";
}
