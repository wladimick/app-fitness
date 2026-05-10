// supabase/edge-functions/crear-preferencia-mp/index.ts
// DeFatFit v7 — Edge Function: Crear preferencia de Mercado Pago
//
// DEPLOY: supabase functions deploy crear-preferencia-mp
//
// IMPORTANTE: Agregar en Supabase > Settings > Edge Functions > Secrets:
//   MP_ACCESS_TOKEN = tu_access_token_de_mercado_pago
//   MP_NOTIFICATION_URL = https://tuproyecto.supabase.co/functions/v1/mp-webhook

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sin token de autenticación");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Usuario no autenticado");

    // Obtener el planId del body
    const { planId } = await req.json();
    if (!planId) throw new Error("planId requerido");

    // Obtener datos del plan
    const { data: plan, error: planError } = await supabase
      .from("planes_suscripcion")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan) throw new Error("Plan no encontrado");
    if (plan.precio_clp == null) throw new Error("Plan sin precio configurado");

    // Obtener perfil del usuario
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("email, nombre")
      .eq("id", user.id)
      .maybeSingle();

    // Llamar a la API de Mercado Pago
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MP_ACCESS_TOKEN no configurado en secrets");

    const notificationUrl = Deno.env.get("MP_NOTIFICATION_URL") || "";

    const preference = {
      items: [
        {
          title: `DeFatFit — ${plan.nombre}`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: plan.precio_clp,
        },
      ],
      payer: {
        email: perfil?.email || user.email,
        name: perfil?.nombre || "",
      },
      external_reference: `${user.id}|${planId}`,
      notification_url: notificationUrl,
      back_urls: {
        success: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-return?status=success`,
        failure: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-return?status=failure`,
        pending: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-return?status=pending`,
      },
      auto_return: "approved",
      expires: false,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      throw new Error(`Error MP: ${errText}`);
    }

    const mpData = await mpResponse.json();

    return new Response(
      JSON.stringify({
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
