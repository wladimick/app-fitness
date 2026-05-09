// DeFatFit v3 — screens/perfil-usuario.js

function initUsuario() {
  const p = window.currentProfile || {};
  const u = {
    nombre:     p.nombre     || '',
    peso:       p.peso_actual || 0,
    nivel:      p.nivel      || 'principiante',
    enfoque:    p.objetivo   || '',
    objetivo:   p.objetivo   || '',
    frecuencia: p.frecuencia_semanal || 4,
    tipo:       'Fuerza + Hipertrofia',
    prioridad:  'Torso',
    preferencias: [],
    marcas: [
      { ejercicio: 'Fondos lastrados',       marca: '+30 kg' },
      { ejercicio: 'Dominada supina lastrada',marca: '+25 kg' },
      { ejercicio: 'Sentadilla libre',        marca: '140 kg' },
      { ejercicio: 'Press banca',             marca: '80-90 kg' },
      { ejercicio: 'Remo mancuerna',          marca: '30 kg × 10' },
      { ejercicio: 'Ext. cuádriceps',         marca: '70-77 kg' },
      { ejercicio: 'Curl femoral',            marca: '70 kg' },
    ],
  };

  // Edad
  const edad = calcularEdad(p.fecha_nacimiento);

  // Avatar
  const av = document.getElementById('perfil-avatar');
  if (av) av.textContent = getIniciales(u.nombre);

  const nm = document.getElementById('perfil-nombre');
  if (nm) nm.textContent = u.nombre;

  const nobj = document.getElementById('perfil-nivel-obj');
  if (nobj) nobj.textContent = edad
    ? `${capitalize(u.nivel)} · ${edad} años`
    : capitalize(u.nivel);

  // Badges
  const bn = document.getElementById('perfil-badge-nivel');
  if (bn) bn.textContent = '📊 ' + capitalize(u.nivel);

  const bf = document.getElementById('perfil-badge-freq');
  if (bf) bf.textContent = `📅 ${u.frecuencia} días/semana`;

  const bt = document.getElementById('perfil-badge-tipo');
  if (bt) bt.textContent = u.tipo;

  // Stats
  const ep = document.getElementById('perfil-peso');
  if (ep) ep.textContent = u.peso || '—';

  const ed = document.getElementById('perfil-dias');
  if (ed) ed.textContent = u.frecuencia;

  const epr = document.getElementById('perfil-prioridad');
  if (epr) epr.textContent = u.prioridad;

  // Edad en stats
  const eedad = document.getElementById('perfil-edad');
  if (eedad) eedad.textContent = edad || '—';

  // Objetivo
  const obj = document.getElementById('perfil-objetivo');
  if (obj) obj.textContent = u.objetivo || 'Sin objetivo definido';

  // Marcas
  const marcasEl = document.getElementById('perfil-marcas');
  if (marcasEl) {
    marcasEl.innerHTML = u.marcas.map((m, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;
        ${i < u.marcas.length - 1 ? 'border-bottom:1px solid var(--border)' : ''}">
        <span style="font-size:13px;color:var(--muted)">${m.ejercicio}</span>
        <span style="font-family:var(--font-m);font-size:14px;font-weight:600;color:var(--accent)">${m.marca}</span>
      </div>
    `).join('');
  }
}

function abrirEditarPerfil() {
  const p = window.currentProfile || {};
  document.getElementById('ep-nombre').value    = p.nombre        || '';
  document.getElementById('ep-peso').value      = p.peso_actual   || '';
  document.getElementById('ep-freq').value      = p.frecuencia_semanal || 4;
  document.getElementById('ep-nivel').value     = p.nivel         || 'principiante';
  document.getElementById('ep-objetivo').value  = p.objetivo      || '';
  document.getElementById('ep-fecha-nac').value = p.fecha_nacimiento || '';
  openOverlay('modal-edit-perfil');
}

async function guardarPerfil() {
  const updates = {
    nombre:            document.getElementById('ep-nombre').value.trim(),
    peso_actual:       parseFloat(document.getElementById('ep-peso').value) || null,
    frecuencia_semanal:parseInt(document.getElementById('ep-freq').value)   || 4,
    nivel:             document.getElementById('ep-nivel').value,
    objetivo:          document.getElementById('ep-objetivo').value.trim(),
    fecha_nacimiento:  document.getElementById('ep-fecha-nac').value || null,
  };

  // Guardar en Supabase. Usamos upsert para no perder cambios si el perfil aún no existe.
  if (window.currentUser) {
    try {
      const { data, error } = await window.db
        .from('perfiles')
        .upsert({
          id: window.currentUser.id,
          rol: window.currentProfile?.rol || 'usuario',
          ...updates,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      window.currentProfile = data;
    } catch (e) {
      console.error('No se pudo guardar en Supabase:', e);
      showToast('No se pudo guardar el perfil en Supabase');
      return;
    }
  } else {
    window.currentProfile = { ...window.currentProfile, ...updates };
  }

  closeOverlay('modal-edit-perfil');
  initUsuario();
  initDashboard?.();
  showToast('✅ Perfil actualizado');
}

window.initUsuario      = initUsuario;
window.abrirEditarPerfil= abrirEditarPerfil;
window.guardarPerfil    = guardarPerfil;
