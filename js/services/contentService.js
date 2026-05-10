// Servicio de contenidos: consejos + mensajes de inicio
const contentService = (() => {
  async function obtenerConsejosPublicos(categoria = null) {
    let q = window.db.from('consejos').select('*').eq('activo', true).lte('fecha_publicacion', new Date().toISOString());
    if (categoria) q = q.eq('categoria', categoria);
    const { data, error } = await q.order('fecha_publicacion', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async function obtenerConsejosAdmin() {
    const { data, error } = await window.db.from('consejos').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async function upsertConsejo(payload) {
    const { data, error } = await window.db.from('consejos').upsert(payload).select().maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  async function obtenerMensajesInicio() {
    const hoy = new Date().toISOString();
    const { data, error } = await window.db
      .from('mensajes_inicio')
      .select('*')
      .eq('activo', true)
      .lte('fecha_inicio', hoy)
      .or(`fecha_termino.is.null,fecha_termino.gte.${hoy}`)
      .order('fecha_inicio', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async function obtenerMensajesAdmin() {
    const { data, error } = await window.db.from('mensajes_inicio').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async function upsertMensaje(payload) {
    const { data, error } = await window.db.from('mensajes_inicio').upsert(payload).select().maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  return { obtenerConsejosPublicos, obtenerConsejosAdmin, upsertConsejo, obtenerMensajesInicio, obtenerMensajesAdmin, upsertMensaje };
})();
