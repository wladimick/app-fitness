// DeFatFit v3 — screens/inicio.js

function initDashboard() {
  const p = window.currentProfile || {};
  const r = window._rutinaHoy || defaultRutina();

  // Saludo + nombre desde Supabase
  const el = document.getElementById('dash-saludo');
  const nm = document.getElementById('dash-nombre');
  if (el) el.textContent = saludo();
  if (nm) nm.textContent = (p.nombre || 'Usuario').split(' ')[0].toUpperCase();

  // Hero card: rutina del día
  const hoy = new Date();
  const tag = document.getElementById('dash-rutina-tag');
  if (tag) tag.textContent = `📅 HOY · ${diaSemana().toUpperCase()}`;

  const rNombre = document.getElementById('dash-rutina-nombre');
  if (rNombre) rNombre.textContent = r.nombre;

  const dur = document.getElementById('dash-duracion');
  if (dur) dur.textContent = r.duracionMinutos + ' min';

  const grp = document.getElementById('dash-grupo');
  if (grp) grp.textContent = r.grupoPrincipal;

  const niv = document.getElementById('dash-nivel-badge');
  if (niv) niv.textContent = r.nivel;

  // Stats
  const racha = document.getElementById('dash-racha');
  if (racha) racha.textContent = p.racha || 0;

  const peso = document.getElementById('dash-peso');
  if (peso) peso.textContent = p.peso_actual || p.peso || '—';

  // Tip del día
  renderTipDelDia('tip-del-dia');

  // Alimentación de hoy
  window.updateAlimentacionDashboard?.();

  // Progreso
  updateDashProgress();
}

function updateDashProgress() {
  const r = window._rutinaHoy || defaultRutina();
  const total = r.ejercicios.length;
  const done  = r.ejercicios.filter(e => e.completado).length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  const bar = document.getElementById('dash-prog');
  const lbl = document.getElementById('dash-prog-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = `${done} / ${total} ejercicios`;
}

window.initDashboard = initDashboard;
window.updateDashProgress = updateDashProgress;
