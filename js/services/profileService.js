// js/services/profileService.js
// DeFatFit v7 — Servicio de perfil de usuario

const profileService = (() => {
  // Cache local para evitar múltiples peticiones
  let _perfil = null;

  /**
   * Obtiene el perfil del usuario autenticado.
   * Si no existe, lo intenta crear.
   */
  async function obtenerPerfil(userId) {
    if (_perfil && _perfil.id === userId) return _perfil;

    const { data, error } = await window.supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[profileService] Error al obtener perfil:', error.message);
      return null;
    }

    if (!data) {
      // El trigger debería haberlo creado, pero lo creamos si falla
      return await crearPerfil(userId);
    }

    _perfil = data;
    return _perfil;
  }

  /**
   * Crea el perfil del usuario si no existe (fallback del trigger).
   */
  async function crearPerfil(userId) {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await window.supabase
      .from('perfiles')
      .insert({
        id: userId,
        email: user.email,
        nombre: user.user_metadata?.nombre || user.email.split('@')[0],
        rol: 'usuario',
        estado: 'activo',
        nivel: 'principiante',
        onboarding_completo: false
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[profileService] Error al crear perfil:', error.message);
      return null;
    }

    _perfil = data;
    return _perfil;
  }

  /**
   * Actualiza campos del perfil del usuario.
   */
  async function actualizarPerfil(userId, campos) {
    const { data, error } = await window.supabase
      .from('perfiles')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[profileService] Error al actualizar perfil:', error.message);
      return { ok: false, error: error.message };
    }

    _perfil = data;
    return { ok: true, data };
  }

  /**
   * Obtiene todos los perfiles (solo admin).
   */
  async function obtenerTodosLosPerfiles() {
    const { data, error } = await window.supabase
      .from('perfiles')
      .select('id, email, nombre, rol, estado, nivel, peso_actual, frecuencia_semanal, racha, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[profileService] Error al listar perfiles:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Limpia el cache local (útil al cerrar sesión).
   */
  function limpiarCache() {
    _perfil = null;
  }

  /**
   * Verifica si el perfil cacheado es admin.
   */
  function esAdmin() {
    return _perfil?.rol === 'admin';
  }

  return {
    obtenerPerfil,
    crearPerfil,
    actualizarPerfil,
    obtenerTodosLosPerfiles,
    limpiarCache,
    esAdmin,
    get perfilActual() { return _perfil; }
  };
})();
