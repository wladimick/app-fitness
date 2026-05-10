// js/services/emailService.js
// DeFatFit v7 — Servicio de emails (frontend)
// Llama a la Edge Function enviar-email. Nunca pone la API key aquí.

const emailService = (() => {

  /**
   * Función base que llama a la Edge Function.
   * Todos los métodos públicos la usan internamente.
   */
  async function _enviar(tipo, destinatario, datos = {}) {
    try {
      const { error } = await window.supabase.functions.invoke('enviar-email', {
        body: { tipo, destinatario, datos }
      });

      if (error) {
        console.warn(`[emailService] Error enviando "${tipo}":`, error.message);
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (err) {
      console.warn(`[emailService] Excepción enviando "${tipo}":`, err.message);
      return { ok: false, error: err.message };
    }
  }

  // ─────────────────────────────────────────────
  // CUENTA
  // ─────────────────────────────────────────────

  async function bienvenida(email, nombre) {
    return _enviar('bienvenida', email, { nombre });
  }

  async function trialActivado(email, nombre, fechaTermino) {
    return _enviar('trial_activado', email, { nombre, fecha: _formatFecha(fechaTermino) });
  }

  async function cuentaSuspendida(email, nombre) {
    return _enviar('cuenta_suspendida', email, { nombre });
  }

  async function cuentaReactivada(email, nombre) {
    return _enviar('cuenta_reactivada', email, { nombre });
  }

  async function cuentaBaja(email, nombre) {
    return _enviar('cuenta_baja', email, { nombre });
  }

  async function resetPassword(email, nombre, linkReset) {
    return _enviar('reset_password', email, { nombre, link: linkReset });
  }

  // ─────────────────────────────────────────────
  // SUSCRIPCIÓN
  // ─────────────────────────────────────────────

  async function planAdquirido(email, nombre, planNombre, fechaTermino, montoCLP = null) {
    return _enviar('plan_adquirido', email, {
      nombre,
      plan: planNombre,
      fecha: _formatFecha(fechaTermino),
      monto: montoCLP || ''
    });
  }

  async function planPorVencer(email, nombre, planNombre, fechaTermino, diasRestantes) {
    return _enviar('plan_por_vencer', email, {
      nombre,
      plan: planNombre,
      fecha: _formatFecha(fechaTermino),
      dias: diasRestantes
    });
  }

  async function planVencido(email, nombre, planNombre, fechaTermino) {
    return _enviar('plan_vencido', email, {
      nombre,
      plan: planNombre,
      fecha: _formatFecha(fechaTermino)
    });
  }

  async function planCancelado(email, nombre, planNombre, fechaTermino) {
    return _enviar('plan_cancelado', email, {
      nombre,
      plan: planNombre,
      fecha: _formatFecha(fechaTermino)
    });
  }

  // ─────────────────────────────────────────────
  // PAGOS
  // ─────────────────────────────────────────────

  async function pagoAprobado(email, nombre, planNombre, fechaTermino, montoCLP) {
    return _enviar('pago_aprobado', email, {
      nombre,
      plan: planNombre,
      fecha: _formatFecha(fechaTermino),
      monto: montoCLP
    });
  }

  async function pagoFallido(email, nombre, planNombre) {
    return _enviar('pago_fallido', email, { nombre, plan: planNombre });
  }

  // ─────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────

  async function avisoNuevoUsuarioAdmin(adminEmail, nombre, emailUsuario) {
    return _enviar('bienvenida_admin', adminEmail, {
      nombre,
      email: emailUsuario,
      fecha: new Date().toLocaleDateString('es-CL')
    });
  }

  // ─────────────────────────────────────────────
  // HELPER
  // ─────────────────────────────────────────────

  function _formatFecha(fecha) {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
  }

  return {
    bienvenida,
    trialActivado,
    cuentaSuspendida,
    cuentaReactivada,
    cuentaBaja,
    resetPassword,
    planAdquirido,
    planPorVencer,
    planVencido,
    planCancelado,
    pagoAprobado,
    pagoFallido,
    avisoNuevoUsuarioAdmin
  };
})();
