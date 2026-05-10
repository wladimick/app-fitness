// js/services/paymentService.js
// DeFatFit v7 — Servicio de pagos (frontend)
//
// IMPORTANTE: Este archivo NO contiene ninguna clave secreta.
// Toda la lógica sensible debe ir en Supabase Edge Functions.
// Ver: supabase/edge-functions/crear-preferencia-mp/index.ts

const paymentService = (() => {

  /**
   * Inicia el flujo de pago con Mercado Pago.
   * Llama a la Edge Function que genera la preferencia.
   * El Access Token NUNCA debe estar en el frontend.
   */
  async function crearPreferenciaMercadoPago(planId) {
    try {
      const { data: { session } } = await window.supabase.auth.getSession();
      if (!session) throw new Error('Sin sesión activa');

      const { data, error } = await window.supabase.functions.invoke('crear-preferencia-mp', {
        body: { planId }
      });

      if (error) throw new Error(error.message);

      return { ok: true, initPoint: data.init_point, preferenceId: data.preference_id };
    } catch (err) {
      console.error('[paymentService] Error Mercado Pago:', err.message);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Inicia el flujo de suscripción con PayPal.
   * El Client Secret NUNCA debe estar en el frontend.
   */
  async function crearSuscripcionPayPal(planId) {
    try {
      const { data, error } = await window.supabase.functions.invoke('crear-suscripcion-paypal', {
        body: { planId }
      });

      if (error) throw new Error(error.message);

      return { ok: true, subscriptionId: data.subscription_id, approveUrl: data.approve_url };
    } catch (err) {
      console.error('[paymentService] Error PayPal:', err.message);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Verifica el estado de un pago (llama a Edge Function).
   */
  async function verificarEstadoPago(paymentId, provider) {
    try {
      const { data, error } = await window.supabase.functions.invoke('verificar-pago', {
        body: { paymentId, provider }
      });

      if (error) throw new Error(error.message);

      return { ok: true, estado: data.estado };
    } catch (err) {
      console.error('[paymentService] Error verificación:', err.message);
      return { ok: false, error: err.message };
    }
  }

  /**
   * MVP: Simula un pago aprobado manualmente (solo para testing).
   * Esto crea un registro de pago manual en la tabla pagos.
   */
  async function simularPagoManual(userId, planId) {
    const hoy = new Date();
    const planes = {
      mensual: 30,
      trimestral: 90,
      anual: 365
    };

    const dias = planes[planId] || 30;
    const termino = new Date(hoy);
    termino.setDate(termino.getDate() + dias);

    // Primero crea el registro de suscripción
    const { data: sub, error: subError } = await window.supabase
      .from('suscripciones')
      .insert({
        user_id: userId,
        plan_id: planId,
        estado: 'activa',
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_termino: termino.toISOString().split('T')[0],
        provider: 'manual'
      })
      .select()
      .maybeSingle();

    if (subError) {
      return { ok: false, error: subError.message };
    }

    // Luego registra el pago
    await window.supabase.from('pagos').insert({
      user_id: userId,
      suscripcion_id: sub.id,
      provider: 'manual',
      estado: 'aprobado',
      moneda: 'CLP',
      fecha_pago: hoy.toISOString()
    });

    return { ok: true, suscripcion: sub };
  }

  /**
   * Obtiene el historial de pagos del usuario.
   */
  async function obtenerHistorialPagos(userId) {
    const { data, error } = await window.supabase
      .from('pagos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[paymentService] Error historial:', error.message);
      return [];
    }

    return data || [];
  }

  return {
    crearPreferenciaMercadoPago,
    crearSuscripcionPayPal,
    verificarEstadoPago,
    simularPagoManual,
    obtenerHistorialPagos
  };
})();
