// js/services/nutritionService.js
// DeFatFit v7 — Servicio de alimentación (reemplaza localStorage)

const nutritionService = (() => {

  const META_VASOS = 11;

  /**
   * Obtiene o crea el registro de alimentación del día.
   */
  async function obtenerRegistroDelDia(userId, fecha) {
    const { data, error } = await window.db
      .from('alimentacion_registros')
      .select('*, alimentacion_porciones(*)')
      .eq('usuario_id', userId)
      .eq('fecha', fecha)
      .maybeSingle();

    if (error) {
      console.error('[nutritionService] Error obtener registro:', error.message);
      return null;
    }

    return data;
  }

  /**
   * Obtiene los grupos de alimentación del catálogo.
   */
  async function obtenerGrupos() {
    const { data, error } = await window.db
      .from('alimentacion_grupos')
      .select('*')
      .eq('activo', true)
      .order('orden');

    if (error) {
      console.error('[nutritionService] Error grupos:', error.message);
      // Fallback a datos locales si Supabase falla
      return _gruposFallback();
    }

    return data || [];
  }

  /**
   * Actualiza (upsert) las porciones de un grupo en el día actual.
   */
  async function actualizarPorcion(userId, fecha, grupoId, cantidad, meta) {
    // Asegurar que existe el registro del día
    const registro = await _upsertRegistro(userId, fecha);
    if (!registro) return { ok: false, error: 'No se pudo crear registro del día' };

    const { error } = await window.db
      .from('alimentacion_porciones')
      .upsert({
        registro_id: registro.id,
        grupo_id: grupoId,
        cantidad,
        meta,
        updated_at: new Date().toISOString()
      }, { onConflict: 'registro_id,grupo_id' });

    if (error) {
      console.error('[nutritionService] Error actualizar porción:', error.message);
      return { ok: false, error: error.message };
    }

    // Verificar si el día quedó completo
    await _verificarCompletitud(registro.id, userId, fecha);

    return { ok: true };
  }

  /**
   * Actualiza el contador de vasos de agua del día.
   */
  async function actualizarAgua(userId, fecha, vasos) {
    const registro = await _upsertRegistro(userId, fecha);
    if (!registro) return { ok: false, error: 'No se pudo crear registro del día' };

    const { error } = await window.db
      .from('alimentacion_registros')
      .update({
        agua_vasos: vasos,
        updated_at: new Date().toISOString()
      })
      .eq('id', registro.id);

    if (error) {
      console.error('[nutritionService] Error agua:', error.message);
      return { ok: false, error: error.message };
    }

    await _verificarCompletitud(registro.id, userId, fecha);
    return { ok: true };
  }

  /**
   * Obtiene registros de los últimos N días (para calendario).
   */
  async function obtenerResumenSemana(userId, diasAtras = 7) {
    const desde = new Date();
    desde.setDate(desde.getDate() - diasAtras);

    const { data, error } = await window.db
      .from('alimentacion_registros')
      .select('fecha, completo, agua_vasos')
      .eq('usuario_id', userId)
      .gte('fecha', desde.toISOString().split('T')[0])
      .order('fecha', { ascending: false });

    if (error) {
      console.error('[nutritionService] Error resumen semana:', error.message);
      return [];
    }

    return data || [];
  }

  // ─────────────────────────────────────────────
  // PRIVADOS
  // ─────────────────────────────────────────────

  async function _upsertRegistro(userId, fecha) {
    const { data, error } = await window.db
      .from('alimentacion_registros')
      .upsert({
        usuario_id: userId,
        fecha,
        updated_at: new Date().toISOString()
      }, { onConflict: 'usuario_id,fecha' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[nutritionService] Error upsert registro:', error.message);
      return null;
    }

    return data;
  }

  async function _verificarCompletitud(registroId, userId, fecha) {
    try {
      // Obtener porciones actuales
      const { data: porciones } = await window.db
        .from('alimentacion_porciones')
        .select('cantidad, meta')
        .eq('registro_id', registroId);

      const { data: registro } = await window.db
        .from('alimentacion_registros')
        .select('agua_vasos')
        .eq('id', registroId)
        .maybeSingle();

      const grupos = await obtenerGrupos();
      const todasCompletadas = grupos.every(g => {
        const porcion = porciones?.find(p => p.grupo_id === g.id);
        return porcion && porcion.cantidad >= (porcion.meta || g.meta);
      });

      const aguaOk = (registro?.agua_vasos || 0) >= META_VASOS;
      const completo = todasCompletadas && aguaOk;

      await window.db
        .from('alimentacion_registros')
        .update({ completo, updated_at: new Date().toISOString() })
        .eq('id', registroId);
    } catch (e) {
      console.warn('[nutritionService] Error verificar completitud:', e.message);
    }
  }

  function _gruposFallback() {
    return [
      { id: 'proteinas', label: 'Proteínas', meta: 10, unidad: 'porciones', orden: 1 },
      { id: 'cereales_carbohidratos', label: 'Cereales / carbohidratos', meta: 1.5, unidad: 'porciones', orden: 2 },
      { id: 'verduras_libre_consumo', label: 'Verduras libre consumo', meta: 2, unidad: 'porciones', orden: 3 },
      { id: 'verduras_general', label: 'Verduras en general', meta: 2, unidad: 'porciones', orden: 4 },
      { id: 'frutas', label: 'Frutas', meta: 1, unidad: 'porción', orden: 5 },
      { id: 'lacteos', label: 'Lácteos', meta: 1, unidad: 'porción', orden: 6 },
      { id: 'aceite', label: 'Aceite', meta: 1, unidad: 'porción', orden: 7 }
    ];
  }

  return {
    obtenerRegistroDelDia,
    obtenerGrupos,
    actualizarPorcion,
    actualizarAgua,
    obtenerResumenSemana,
    META_VASOS
  };
})();
