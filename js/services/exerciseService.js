// js/services/exerciseService.js
// DeFatFit v7 — Servicio de ejercicios y rutinas

const exerciseService = (() => {
  let _ejerciciosCache = null;
  let _rutinasCache = null;

  // ─────────────────────────────────────────────
  // EJERCICIOS
  // ─────────────────────────────────────────────

  async function obtenerEjercicios(filtros = {}) {
    if (_ejerciciosCache && !filtros.forzar) return _ejerciciosCache;

    let query = window.db
      .from('ejercicios_catalogo')
      .select('*')
      .eq('activo', true);

    if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
    if (filtros.nivel) query = query.eq('nivel', filtros.nivel);

    const { data, error } = await query.order('nombre');

    if (error) {
      console.error('[exerciseService] Error ejercicios:', error.message);
      return [];
    }

    if (!filtros.categoria && !filtros.nivel) {
      _ejerciciosCache = data || [];
    }

    return data || [];
  }

  async function obtenerEjercicioPorId(id) {
    const { data, error } = await window.db
      .from('ejercicios_catalogo')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[exerciseService] Error ejercicio por id:', error.message);
      return null;
    }
    return data;
  }

  // ─────────────────────────────────────────────
  // RUTINAS
  // ─────────────────────────────────────────────

  async function obtenerRutinasTemplate() {
    if (_rutinasCache) return _rutinasCache;

    const { data, error } = await window.db
      .from('rutinas')
      .select('*')
      .eq('es_template', true)
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('[exerciseService] Error rutinas template:', error.message);
      return [];
    }

    _rutinasCache = data || [];
    return _rutinasCache;
  }

  async function obtenerRutinasUsuario(userId) {
    const { data, error } = await window.db
      .from('rutinas')
      .select('*')
      .eq('created_by', userId)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[exerciseService] Error rutinas usuario:', error.message);
      return [];
    }

    return data || [];
  }

  async function obtenerEjerciciosDeRutina(rutinaId) {
    const { data, error } = await window.db
      .from('rutina_ejercicios')
      .select('*, ejercicios_catalogo(nombre, grupo_muscular, instrucciones, nota)')
      .eq('rutina_id', rutinaId)
      .order('orden');

    if (error) {
      console.error('[exerciseService] Error ejercicios de rutina:', error.message);
      return [];
    }

    return (data || []).map(re => ({
      ...re,
      nombre: re.nombre_override || re.ejercicios_catalogo?.nombre || 'Ejercicio',
      grupo_muscular: re.grupo_muscular_override || re.ejercicios_catalogo?.grupo_muscular || '',
      instrucciones: re.ejercicios_catalogo?.instrucciones || '',
      nota: re.nota || re.ejercicios_catalogo?.nota || ''
    }));
  }

  // ─────────────────────────────────────────────
  // PLANIFICACIÓN DE DÍAS
  // ─────────────────────────────────────────────

  async function obtenerPlanificacionMes(userId, anio, mes) {
    const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const fin = new Date(anio, mes, 0).toISOString().split('T')[0];

    const { data, error } = await window.db
      .from('calendario')
      .select('*, rutinas(nombre, grupo_principal, duracion_minutos)')
      .eq('usuario_id', userId)
      .gte('fecha', inicio)
      .lte('fecha', fin);

    if (error) {
      console.error('[exerciseService] Error planificación mes:', error.message);
      return [];
    }

    return data || [];
  }

  async function obtenerDiaPlanificado(userId, fecha) {
    const { data, error } = await window.db
      .from('calendario')
      .select('*, rutinas(*, rutina_ejercicios(*, ejercicios_catalogo(*)))')
      .eq('usuario_id', userId)
      .eq('fecha', fecha)
      .maybeSingle();

    if (error) {
      console.error('[exerciseService] Error día planificado:', error.message);
      return null;
    }

    return data;
  }

  async function upsertDiaPlanificado(userId, fecha, rutinaId, estado = 'pendiente') {
    const { data, error } = await window.db
      .from('calendario')
      .upsert({
        usuario_id: userId,
        fecha,
        rutina_id: rutinaId,
        estado,
        updated_at: new Date().toISOString()
      }, { onConflict: 'usuario_id,fecha' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[exerciseService] Error upsert día:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  }

  async function actualizarEstadoDia(userId, fecha, estado) {
    const { error } = await window.db
      .from('calendario')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('usuario_id', userId)
      .eq('fecha', fecha);

    if (error) {
      console.error('[exerciseService] Error actualizar estado día:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // SESIONES DE ENTRENAMIENTO
  // ─────────────────────────────────────────────

  async function iniciarSesion(userId, rutinaId, planificacionId = null) {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await window.db
      .from('sesiones_entrenamiento')
      .insert({
        usuario_id: userId,
        rutina_id: rutinaId,
        planificacion_id: planificacionId,
        fecha: hoy,
        estado: 'en_progreso',
        inicio: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[exerciseService] Error iniciar sesión:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, sesion: data };
  }

  async function completarEjercicioEnSesion(sesionId, ejercicioId, nombre, orden, datosCompletado) {
    const { data, error } = await window.db
      .from('sesion_ejercicios')
      .upsert({
        sesion_id: sesionId,
        ejercicio_id: ejercicioId,
        nombre,
        orden,
        completado: true,
        ...datosCompletado,
        updated_at: new Date().toISOString()
      }, { onConflict: 'sesion_id,orden' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[exerciseService] Error completar ejercicio:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  }

  async function completarSesion(sesionId, userId, fecha) {
    const inicio = new Date();
    const termino = new Date();
    const duracion = Math.round((termino - inicio) / 60000) || 60;

    const { error } = await window.db
      .from('sesiones_entrenamiento')
      .update({
        estado: 'completada',
        termino: termino.toISOString(),
        duracion_minutos: duracion,
        updated_at: termino.toISOString()
      })
      .eq('id', sesionId);

    if (error) {
      console.error('[exerciseService] Error completar sesión:', error.message);
      return { ok: false, error: error.message };
    }

    // Actualizar día en planificación
    await actualizarEstadoDia(userId, fecha, 'completado');

    // Incrementar racha (best effort)
    await window.db.rpc('incrementar_racha', { uid: userId }).catch(() => {});

    return { ok: true };
  }

  function limpiarCache() {
    _ejerciciosCache = null;
    _rutinasCache = null;
  }

  return {
    obtenerEjercicios,
    obtenerEjercicioPorId,
    obtenerRutinasTemplate,
    obtenerRutinasUsuario,
    obtenerEjerciciosDeRutina,
    obtenerPlanificacionMes,
    obtenerDiaPlanificado,
    upsertDiaPlanificado,
    actualizarEstadoDia,
    iniciarSesion,
    completarEjercicioEnSesion,
    completarSesion,
    limpiarCache
  };
})();
