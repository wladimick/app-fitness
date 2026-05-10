// js/services/subscriptionService.js
// DeFatFit v7 — Servicio de suscripciones

const subscriptionService = (() => {
  let _suscripcion = null;

  /**
   * Obtiene la suscripción activa/trial del usuario.
   * Usa la vista v_suscripcion_actual.
   */
  async function obtenerSuscripcionActual(userId) {
    const { data, error } = await window.supabase
      .from('v_suscripcion_actual')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[subscriptionService] Vista no disponible, fallback a tabla:', error.message);
      return await _obtenerDesdeTablaSuscripciones(userId);
    }

    _suscripcion = data;
    return _suscripcion;
  }

  async function _obtenerDesdeTablaSuscripciones(userId) {
    const { data, error } = await window.supabase
      .from('suscripciones')
      .select('*, planes_suscripcion(nombre)')
      .eq('user_id', userId)
      .in('estado', ['trial', 'activa', 'pendiente'])
      .order('fecha_termino', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[subscriptionService] Error:', error.message);
      return null;
    }

    if (!data) return null;

    const hoy = new Date().toISOString().split('T')[0];
    _suscripcion = {
      ...data,
      plan_nombre: data.planes_suscripcion?.nombre,
      acceso_activo: ['trial', 'activa'].includes(data.estado) && data.fecha_termino >= hoy
    };
    return _suscripcion;
  }

  /**
   * Verifica si el usuario tiene acceso activo.
   */
  function tieneAcceso() {
    return _suscripcion?.acceso_activo === true;
  }

  /**
   * Activa trial de 15 días para el usuario.
   */
  async function activarTrial(userId) {
    const hoy = new Date();
    const termino = new Date(hoy);
    termino.setDate(termino.getDate() + 15);

    const { data, error } = await window.supabase
      .from('suscripciones')
      .insert({
        user_id: userId,
        plan_id: 'prueba_15',
        estado: 'trial',
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_termino: termino.toISOString().split('T')[0],
        provider: 'manual'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[subscriptionService] Error al activar trial:', error.message);
      return { ok: false, error: error.message };
    }

    _suscripcion = {
      ...data,
      plan_nombre: 'Prueba de 15 días',
      acceso_activo: true
    };
    return { ok: true, data };
  }

  /**
   * Obtiene todos los planes disponibles.
   */
  async function obtenerPlanes() {
    const { data, error } = await window.supabase
      .from('planes_suscripcion')
      .select('*')
      .eq('activo', true)
      .order('orden');

    if (error) {
      console.error('[subscriptionService] Error al obtener planes:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Admin: obtiene suscripciones de todos los usuarios.
   */
  async function obtenerTodasLasSuscripciones() {
    const { data, error } = await window.supabase
      .from('suscripciones')
      .select('*, perfiles(nombre, email), planes_suscripcion(nombre)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[subscriptionService] Error admin:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Admin: activa trial manualmente para un usuario.
   */
  async function activarTrialAdmin(userId) {
    return await activarTrial(userId);
  }

  /**
   * Días restantes de suscripción.
   */
  function diasRestantes() {
    if (!_suscripcion?.fecha_termino) return 0;
    const hoy = new Date();
    const termino = new Date(_suscripcion.fecha_termino);
    const diff = Math.ceil((termino - hoy) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  function limpiarCache() {
    _suscripcion = null;
  }

  return {
    obtenerSuscripcionActual,
    tieneAcceso,
    activarTrial,
    obtenerPlanes,
    obtenerTodasLasSuscripciones,
    activarTrialAdmin,
    diasRestantes,
    limpiarCache,
    get suscripcionActual() { return _suscripcion; }
  };
})();
