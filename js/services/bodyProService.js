// js/services/bodyProService.js
// DeFatFit v7 — Servicio de métricas Body Pro

const bodyProService = (() => {

  /**
   * Obtiene las últimas 2 mediciones del usuario (actual y anterior).
   */
  async function obtenerUltimasMediciones(userId, limite = 2) {
    const { data, error } = await window.db
      .from('mediciones')
      .select('*')
      .eq('usuario_id', userId)
      .order('fecha', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('[bodyProService] Error mediciones:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Obtiene el historial completo para gráficos.
   */
  async function obtenerHistorial(userId, meses = 6) {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - meses);

    const { data, error } = await window.db
      .from('mediciones')
      .select('fecha, peso, grasa_corporal, masa_muscular, imc')
      .eq('usuario_id', userId)
      .gte('fecha', desde.toISOString().split('T')[0])
      .order('fecha', { ascending: true });

    if (error) {
      console.error('[bodyProService] Error historial:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Registra una nueva medición Body Pro.
   */
  async function registrarMedicion(userId, medicion) {
    const { data, error } = await window.db
      .from('mediciones')
      .insert({
        usuario_id: userId,
        fecha: medicion.fecha || new Date().toISOString().split('T')[0],
        peso: medicion.peso || null,
        grasa_corporal: medicion.grasaCorporal || null,
        masa_muscular: medicion.masaMuscular || null,
        agua_corporal: medicion.aguaCorporal || null,
        grasa_visceral: medicion.grasaVisceral || null,
        imc: medicion.imc || null,
        metabolismo_basal: medicion.metabolismoBasal || null,
        edad_corporal: medicion.edadCorporal || null
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[bodyProService] Error registrar medición:', error.message);
      return { ok: false, error: error.message };
    }

    // Actualizar peso en perfil si viene en la medición
    if (medicion.peso) {
      await window.db
        .from('perfiles')
        .update({ peso_actual: medicion.peso, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return { ok: true, data };
  }

  /**
   * Calcula la diferencia entre dos mediciones.
   */
  function calcularDiferencia(actual, anterior) {
    if (!actual || !anterior) return {};

    const campos = ['peso', 'grasa_corporal', 'masa_muscular', 'agua_corporal', 'imc'];
    const diff = {};

    campos.forEach(campo => {
      if (actual[campo] != null && anterior[campo] != null) {
        const delta = parseFloat(actual[campo]) - parseFloat(anterior[campo]);
        diff[campo] = {
          actual: actual[campo],
          anterior: anterior[campo],
          delta: delta.toFixed(1),
          positivo: delta > 0
        };
      }
    });

    return diff;
  }

  /**
   * Admin: obtiene todas las métricas de todos los usuarios.
   */
  async function obtenerTodasLasMetricas() {
    const { data, error } = await window.db
      .from('mediciones')
      .select('*, perfiles(nombre, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[bodyProService] Error admin métricas:', error.message);
      return [];
    }

    return data || [];
  }

  return {
    obtenerUltimasMediciones,
    obtenerHistorial,
    registrarMedicion,
    calcularDiferencia,
    obtenerTodasLasMetricas
  };
})();
