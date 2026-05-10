// js/services/supplementService.js
// DeFatFit v7 — Servicio de suplementos

const supplementService = (() => {

  /**
   * Obtiene el catálogo de suplementos activos.
   */
  async function obtenerSuplementos() {
    const { data, error } = await window.supabase
      .from('suplementos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('[supplementService] Error catálogo:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Obtiene los suplementos activos del usuario con su configuración personal.
   */
  async function obtenerSuplementosUsuario(userId) {
    const { data, error } = await window.supabase
      .from('usuario_suplementos')
      .select('*, suplementos(*)')
      .eq('user_id', userId)
      .eq('activo', true);

    if (error) {
      console.error('[supplementService] Error suplementos usuario:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Activa o desactiva un suplemento para el usuario.
   */
  async function toggleSuplemento(userId, suplementoId, activo, config = {}) {
    const { data, error } = await window.supabase
      .from('usuario_suplementos')
      .upsert({
        user_id: userId,
        suplemento_id: suplementoId,
        activo,
        dosis_personalizada: config.dosis || null,
        horario: config.horario || null,
        notas: config.notas || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,suplemento_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[supplementService] Error toggle suplemento:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  }

  /**
   * Admin: actualiza un suplemento del catálogo.
   */
  async function actualizarSuplementoAdmin(id, campos) {
    const { data, error } = await window.supabase
      .from('suplementos')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[supplementService] Error actualizar suplemento:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  }

  return {
    obtenerSuplementos,
    obtenerSuplementosUsuario,
    toggleSuplemento,
    actualizarSuplementoAdmin
  };
})();
