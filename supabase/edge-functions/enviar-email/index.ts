// supabase/edge-functions/enviar-email/index.ts
// DeFatFit v7 — Edge Function: Sistema de notificaciones por email (SendGrid)
//
// DEPLOY: supabase functions deploy enviar-email --project-ref TU_REF
//
// SECRETS requeridos en Supabase > Edge Functions > Secrets:
//   SENDGRID_API_KEY   = SG.xxxx...
//   EMAIL_FROM         = hola@tudominio.com
//   EMAIL_FROM_NAME    = DeFatFit
//   APP_URL            = https://tuapp.netlify.app (o tu dominio)
//
// USO INTERNO (desde otras Edge Functions o triggers de DB):
//   POST /functions/v1/enviar-email
//   Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY
//   Body: { "tipo": "bienvenida", "destinatario": "user@email.com", "datos": { "nombre": "Wladimick" } }
//
// TIPOS DE EMAIL DISPONIBLES:
//   bienvenida         → al crear cuenta
//   trial_activado     → al activar prueba de 15 días
//   plan_adquirido     → al comprar un plan
//   plan_cancelado     → al cancelar suscripción
//   plan_por_vencer    → recordatorio N días antes de vencer
//   plan_vencido       → suscripción expirada
//   cuenta_suspendida  → admin suspende la cuenta
//   cuenta_reactivada  → admin reactiva la cuenta
//   cuenta_baja        → cuenta dada de baja
//   reset_password     → recuperar contraseña (complementa el de Supabase Auth)
//   pago_aprobado      → confirmación de pago recibido
//   pago_fallido       → problema con el pago
//   bienvenida_admin   → nuevo usuario registrado (aviso al admin)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
const EMAIL_FROM       = Deno.env.get("EMAIL_FROM") || "hola@defatfit.com";
const EMAIL_FROM_NAME  = Deno.env.get("EMAIL_FROM_NAME") || "DeFatFit";
const APP_URL          = Deno.env.get("APP_URL") || "https://app-fitness.netlify.app";
const ADMIN_EMAIL      = Deno.env.get("ADMIN_EMAIL") || EMAIL_FROM;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

interface EmailPayload {
  tipo: string;
  destinatario: string;
  datos?: Record<string, string | number | boolean>;
}

// ─────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload: EmailPayload = await req.json();
    const { tipo, destinatario, datos = {} } = payload;

    if (!tipo || !destinatario) {
      throw new Error("Faltan campos requeridos: tipo y destinatario");
    }

    const template = obtenerTemplate(tipo, datos);
    if (!template) throw new Error(`Tipo de email desconocido: ${tipo}`);

    await enviarConSendGrid(destinatario, template.asunto, template.html, template.texto);

    console.log(`[enviar-email] ✅ Email "${tipo}" enviado a ${destinatario}`);
    return new Response(
      JSON.stringify({ ok: true, tipo, destinatario }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[enviar-email] Error:", error.message);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─────────────────────────────────────────────
// ENVÍO CON SENDGRID
// ─────────────────────────────────────────────

async function enviarConSendGrid(
  para: string,
  asunto: string,
  html: string,
  texto: string
) {
  const body = {
    personalizations: [{ to: [{ email: para }] }],
    from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
    subject: asunto,
    content: [
      { type: "text/plain", value: texto },
      { type: "text/html",  value: html  },
    ],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }
}

// ─────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────

function obtenerTemplate(tipo: string, d: Record<string, string | number | boolean>) {
  const nombre = String(d.nombre || "");
  const plan   = String(d.plan || "");
  const dias   = String(d.dias || "");
  const fecha  = String(d.fecha || "");
  const monto  = String(d.monto || "");
  const link   = String(d.link || APP_URL);

  const templates: Record<string, { asunto: string; html: string; texto: string }> = {

    // ──────────────────────────────────
    // CUENTA
    // ──────────────────────────────────

    bienvenida: {
      asunto: "¡Bienvenido a DeFatFit! 💪",
      texto: `Hola ${nombre},\n\nTu cuenta fue creada exitosamente.\n\nEmpieza activando tu prueba gratuita de 15 días en ${APP_URL}\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>¡Bienvenido, ${nombre}! 💪</h1>
        <p>Tu cuenta en <strong>DeFatFit</strong> fue creada exitosamente.</p>
        <p>Estás a un paso de tener tu rutina, calendario y seguimiento físico en un solo lugar.</p>
        ${boton("Activar prueba gratis de 15 días", `${APP_URL}`)}
        <p class="note">Tu prueba gratuita incluye acceso completo a rutinas, Body Pro, alimentación y más.</p>
      `),
    },

    trial_activado: {
      asunto: "Tu prueba gratuita de 15 días está activa 🟢",
      texto: `Hola ${nombre},\n\nTu prueba gratuita de 15 días fue activada.\n\nTienes acceso completo hasta el ${fecha}.\n\nEntra en ${APP_URL}\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Tu prueba está activa 🟢</h1>
        <p>Hola <strong>${nombre}</strong>, tienes <strong>15 días de acceso completo</strong> a DeFatFit.</p>
        <div class="highlight">
          <p>📅 Acceso hasta el <strong>${fecha}</strong></p>
        </div>
        <p>Qué puedes hacer durante tu prueba:</p>
        <ul>
          <li>✅ Ver y completar tu rutina del día</li>
          <li>✅ Registrar mediciones Body Pro</li>
          <li>✅ Seguir tu plan de alimentación</li>
          <li>✅ Revisar tu calendario de entrenamientos</li>
          <li>✅ Ver el catálogo de suplementos</li>
        </ul>
        ${boton("Ir a la app", APP_URL)}
      `),
    },

    cuenta_suspendida: {
      asunto: "Tu cuenta DeFatFit ha sido suspendida",
      texto: `Hola ${nombre},\n\nTu cuenta fue suspendida temporalmente.\n\nSi crees que esto es un error, contáctanos respondiendo este email.\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Cuenta suspendida ⚠️</h1>
        <p>Hola <strong>${nombre}</strong>, tu cuenta en DeFatFit ha sido suspendida temporalmente.</p>
        <p>Durante este período no podrás acceder a la app.</p>
        <p>Si crees que esto es un error o tienes alguna consulta, responde este correo y lo revisamos.</p>
        <p class="note">El equipo DeFatFit</p>
      `),
    },

    cuenta_reactivada: {
      asunto: "Tu cuenta DeFatFit fue reactivada ✅",
      texto: `Hola ${nombre},\n\nTu cuenta fue reactivada. Ya puedes acceder normalmente en ${APP_URL}\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Cuenta reactivada ✅</h1>
        <p>Hola <strong>${nombre}</strong>, tu cuenta en DeFatFit fue reactivada exitosamente.</p>
        <p>Ya tienes acceso completo nuevamente.</p>
        ${boton("Ir a la app", APP_URL)}
      `),
    },

    cuenta_baja: {
      asunto: "Tu cuenta DeFatFit ha sido dada de baja",
      texto: `Hola ${nombre},\n\nTu cuenta en DeFatFit fue dada de baja.\n\nSi fue un error, contáctanos en ${EMAIL_FROM}.\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Cuenta dada de baja</h1>
        <p>Hola <strong>${nombre}</strong>, tu cuenta en DeFatFit fue dada de baja.</p>
        <p>Tus datos serán eliminados en los próximos 30 días según nuestra política de privacidad.</p>
        <p>Si esto fue un error, responde este correo antes de que se eliminen tus datos.</p>
        <p class="note">Gracias por haber sido parte de DeFatFit.</p>
      `),
    },

    reset_password: {
      asunto: "Recupera tu contraseña de DeFatFit 🔐",
      texto: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nHaz clic en este enlace para continuar:\n${link}\n\nEste enlace expira en 1 hora.\n\nSi no solicitaste esto, ignora este mensaje.\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Recuperar contraseña 🔐</h1>
        <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        ${boton("Restablecer contraseña", link)}
        <p class="note">Este enlace expira en <strong>1 hora</strong>.<br>Si no solicitaste esto, puedes ignorar este mensaje.</p>
      `),
    },

    // ──────────────────────────────────
    // SUSCRIPCIÓN
    // ──────────────────────────────────

    plan_adquirido: {
      asunto: `¡Plan ${plan} activado! 🎉`,
      texto: `Hola ${nombre},\n\nTu plan ${plan} fue activado exitosamente.\n\nAcceso hasta el ${fecha}.\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>¡Plan activado! 🎉</h1>
        <p>Hola <strong>${nombre}</strong>, tu suscripción fue procesada correctamente.</p>
        <div class="highlight">
          <p>📦 Plan: <strong>${plan}</strong></p>
          <p>📅 Acceso hasta: <strong>${fecha}</strong></p>
          ${monto ? `<p>💳 Monto cobrado: <strong>$${monto} CLP</strong></p>` : ""}
        </div>
        ${boton("Ir a la app", APP_URL)}
        <p class="note">Si tienes alguna consulta sobre tu suscripción, responde este correo.</p>
      `),
    },

    plan_por_vencer: {
      asunto: `Tu plan vence en ${dias} días ⏳`,
      texto: `Hola ${nombre},\n\nTu plan ${plan} vence el ${fecha} (en ${dias} días).\n\nRenueva en ${APP_URL}\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Tu plan vence pronto ⏳</h1>
        <p>Hola <strong>${nombre}</strong>, te avisamos que tu suscripción <strong>${plan}</strong> vence el <strong>${fecha}</strong>.</p>
        <div class="highlight">
          <p>⏳ Quedan <strong>${dias} días</strong> de acceso</p>
        </div>
        <p>Para seguir sin interrupciones, renueva tu plan antes de esa fecha.</p>
        ${boton("Renovar plan", `${APP_URL}`)}
        <p class="note">Si ya renovaste, ignora este mensaje.</p>
      `),
    },

    plan_vencido: {
      asunto: "Tu plan DeFatFit ha vencido",
      texto: `Hola ${nombre},\n\nTu plan ${plan} venció el ${fecha}.\n\nPuedes renovar en ${APP_URL}\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Tu plan ha vencido</h1>
        <p>Hola <strong>${nombre}</strong>, tu plan <strong>${plan}</strong> venció el <strong>${fecha}</strong>.</p>
        <p>Tu acceso a la app está pausado hasta que renueves.</p>
        ${boton("Renovar ahora", `${APP_URL}`)}
        <p class="note">Todos tus datos están guardados y te esperan cuando renueves.</p>
      `),
    },

    plan_cancelado: {
      asunto: "Cancelación de plan confirmada",
      texto: `Hola ${nombre},\n\nTu plan ${plan} fue cancelado. Mantendrás acceso hasta el ${fecha}.\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Plan cancelado</h1>
        <p>Hola <strong>${nombre}</strong>, confirmamos que tu plan <strong>${plan}</strong> fue cancelado.</p>
        <div class="highlight">
          <p>📅 Mantendrás acceso hasta el <strong>${fecha}</strong></p>
        </div>
        <p>Después de esa fecha tu cuenta pasará a modo gratuito.</p>
        <p>Si cambias de opinión, puedes reactivar tu plan desde la app.</p>
        ${boton("Ir a la app", APP_URL)}
      `),
    },

    // ──────────────────────────────────
    // PAGOS
    // ──────────────────────────────────

    pago_aprobado: {
      asunto: "Pago recibido ✅",
      texto: `Hola ${nombre},\n\nRecibimos tu pago de $${monto} CLP para el plan ${plan}.\n\nAcceso activo hasta ${fecha}.\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Pago recibido ✅</h1>
        <p>Hola <strong>${nombre}</strong>, confirmamos la recepción de tu pago.</p>
        <div class="highlight">
          <p>💳 Monto: <strong>$${monto} CLP</strong></p>
          <p>📦 Plan: <strong>${plan}</strong></p>
          <p>📅 Acceso hasta: <strong>${fecha}</strong></p>
        </div>
        ${boton("Ir a la app", APP_URL)}
        <p class="note">Guarda este correo como comprobante de tu pago.</p>
      `),
    },

    pago_fallido: {
      asunto: "Problema con tu pago ⚠️",
      texto: `Hola ${nombre},\n\nHubo un problema al procesar tu pago para el plan ${plan}.\n\nIntenta nuevamente en ${APP_URL}\n\nEquipo DeFatFit`,
      html: layout(`
        <h1>Problema con tu pago ⚠️</h1>
        <p>Hola <strong>${nombre}</strong>, hubo un inconveniente al procesar tu pago para el plan <strong>${plan}</strong>.</p>
        <p>Esto puede ocurrir por:</p>
        <ul>
          <li>Fondos insuficientes</li>
          <li>Tarjeta vencida o bloqueada</li>
          <li>Error temporal del procesador de pagos</li>
        </ul>
        ${boton("Intentar de nuevo", `${APP_URL}`)}
        <p class="note">Si el problema persiste, contacta a tu banco o escríbenos.</p>
      `),
    },

    // ──────────────────────────────────
    // AVISOS AL ADMIN
    // ──────────────────────────────────

    bienvenida_admin: {
      asunto: `[DeFatFit] Nuevo usuario registrado: ${nombre}`,
      texto: `Nuevo registro:\n\nNombre: ${nombre}\nEmail: ${d.email || ""}\nFecha: ${fecha}\n\nVer en admin: ${APP_URL}`,
      html: layout(`
        <h1>Nuevo usuario registrado 👤</h1>
        <div class="highlight">
          <p>👤 Nombre: <strong>${nombre}</strong></p>
          <p>📧 Email: <strong>${String(d.email || "")}</strong></p>
          <p>📅 Fecha: <strong>${fecha}</strong></p>
        </div>
        ${boton("Ver panel admin", `${APP_URL}`)}
      `),
    },

  };

  return templates[tipo] || null;
}

// ─────────────────────────────────────────────
// LAYOUT HTML BASE
// ─────────────────────────────────────────────

function layout(contenido: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeFatFit</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f4f5;
      color: #18181b;
      padding: 32px 16px;
      font-size: 15px;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 560px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #18181b;
    }
    .logo span { color: #059669; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #18181b;
    }
    p { margin-bottom: 14px; color: #3f3f46; }
    ul { margin: 0 0 16px 20px; }
    li { margin-bottom: 6px; color: #3f3f46; }
    .highlight {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .highlight p { margin-bottom: 6px; color: #15803d; }
    .highlight p:last-child { margin-bottom: 0; }
    .btn {
      display: block;
      width: fit-content;
      margin: 24px auto;
      background: #059669;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
    }
    .note {
      font-size: 13px;
      color: #71717a;
      border-top: 1px solid #f4f4f5;
      padding-top: 16px;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #a1a1aa;
    }
    .footer a { color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">De<span>Fat</span>Fit</div>
    </div>
    <div class="card">
      ${contenido}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} DeFatFit · <a href="${APP_URL}">defatfit.com</a></p>
      <p style="margin-top:6px">Recibiste este email porque tienes una cuenta en DeFatFit.</p>
    </div>
  </div>
</body>
</html>`;
}

function boton(texto: string, url: string): string {
  return `<a href="${url}" class="btn">${texto}</a>`;
}
