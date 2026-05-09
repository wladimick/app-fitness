// DeFatFit v6 — screens/alimentacion.js
// Tracker simple de porciones basado en plan fijo de nutricionista.
// No calcula calorías, no busca alimentos y no crea dietas.

const LS_ALIMENTACION = 'defatfit_alimentacion_v1';

const ALIMENTACION_GRUPOS = [
  { id:'proteinas', label:'Proteínas', meta:10, unidad:'porciones', icon:'protein' },
  { id:'cerealesCarbohidratos', label:'Cereales / carbohidratos', meta:1.5, unidad:'porciones', icon:'carbs' },
  { id:'verdurasLibreConsumo', label:'Verduras libre consumo', meta:2, unidad:'porciones', icon:'leaf' },
  { id:'verdurasGeneral', label:'Verduras en general', meta:2, unidad:'porciones', icon:'bowl' },
  { id:'frutas', label:'Frutas', meta:1, unidad:'porción', icon:'fruit' },
  { id:'lacteos', label:'Lácteos', meta:1, unidad:'porción', icon:'milk' },
  { id:'aceite', label:'Aceite', meta:1, unidad:'porción', icon:'drop' },
];

function _alimentacionStore() {
  try { return JSON.parse(localStorage.getItem(LS_ALIMENTACION) || '{}'); }
  catch(e) { return {}; }
}

function _guardarAlimentacionStore(store) {
  localStorage.setItem(LS_ALIMENTACION, JSON.stringify(store));
}

function alimentacionRegistroDefault(fecha = fechaHoy()) {
  const porciones = {};
  ALIMENTACION_GRUPOS.forEach(g => porciones[g.id] = 0);
  return { fecha, porciones, aguaVasos: 0, completo: false, updatedAt: null };
}

function alimentacionObtenerRegistro(fecha = fechaHoy()) {
  const store = _alimentacionStore();
  return store[fecha] || alimentacionRegistroDefault(fecha);
}

function alimentacionGuardarRegistro(registro) {
  const store = _alimentacionStore();
  const progreso = alimentacionCalcularProgreso(registro);
  store[registro.fecha] = {
    ...registro,
    completo: progreso.diaCompleto,
    updatedAt: new Date().toISOString(),
  };
  _guardarAlimentacionStore(store);

  // Extiende el día existente del calendario simulado cuando está disponible.
  // No crea tablas nuevas ni toca Supabase.
  try {
    const dia = calendarioDias.find(d => d.fecha === registro.fecha);
    if (dia) dia.registroAlimentacion = store[registro.fecha];
  } catch(e) {}

  return store[registro.fecha];
}

function alimentacionCalcularProgreso(registro) {
  const gruposCompletos = ALIMENTACION_GRUPOS.filter(g => (Number(registro.porciones?.[g.id]) || 0) >= g.meta).length;
  const totalGrupos = ALIMENTACION_GRUPOS.length;
  const porcentaje = totalGrupos ? Math.round(gruposCompletos / totalGrupos * 100) : 0;
  const aguaCompleta = (Number(registro.aguaVasos) || 0) >= 11;
  return { gruposCompletos, totalGrupos, porcentaje, aguaCompleta, diaCompleto: gruposCompletos === totalGrupos && aguaCompleta };
}

function alimentacionFormatoNumero(valor) {
  const n = Number(valor) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function alimentacionIcon(name) {
  const icons = {
    protein:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14c-2 0-3-1.2-3-3s1.3-3 3-3c.7-2.2 2.5-3.5 5-3.5s4.3 1.3 5 3.5c1.7 0 3 1.2 3 3s-1 3-3 3"/><path d="M7 14v4.5c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V14"/><path d="M9 11h6"/></svg>',
    carbs:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12c2.5-5.5 7-7.5 14-6-1.2 6.5-4.7 10-10.5 10"/><path d="M4 20c4-7 9-10.5 15-14"/><path d="M8 17c2 1.2 4.3 1.6 7 1"/></svg>',
    leaf:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C12 4 6 8.5 6 15a5 5 0 0 0 5 5c6.5 0 9-8 9-16Z"/><path d="M6 20c2.7-6.3 6.8-10 12-12"/></svg>',
    bowl:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16c-.4 5-3.4 8-8 8s-7.6-3-8-8Z"/><path d="M6 11c.8-2.7 2.8-4 6-4s5.2 1.3 6 4"/><path d="M9 5h.01M12 4h.01M15 5h.01"/></svg>',
    fruit:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-3 0-5.5 2.2-5.5 5.8C6.5 17 9 21 12 21s5.5-4 5.5-8.2C17.5 9.2 15 7 12 7Z"/><path d="M12 7c0-2.5 1.2-4 3.5-4"/><path d="M12 7C10 5.5 8.3 5.5 7 6.4"/></svg>',
    milk:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v4l2 2v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9l2-2V3Z"/><path d="M9 7h6"/><path d="M7 13h10"/></svg>',
    drop:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z"/><path d="M9.5 16a3 3 0 0 0 4 1.4"/></svg>',
    water:'<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z"/></svg>',
  };
  return icons[name] || icons.leaf;
}

function alimentacionContextoDelDia(fecha = fechaHoy()) {
  const cal = (window.calendarioDias || calendarioDias || []).find(d => d.fecha === fecha);
  const resumen = (cal?.resumen || window._rutinaHoy?.nombre || '').toLowerCase();
  const estado = cal?.estado || '';

  if (estado === 'descanso' || resumen.includes('descanso')) {
    return { label:'Día de descanso', text:'Día de descanso — mantén proteínas igual y cuida el agua.' };
  }
  if (resumen.includes('pierna') || resumen.includes('sentadilla')) {
    return { label:'Día de piernas', text:'Hoy entrenas pierna — no elimines carbohidratos.' };
  }
  if (resumen.includes('torso') || resumen.includes('pecho') || resumen.includes('espalda')) {
    return { label:'Día de torso', text:'Hoy tienes torso — prioriza proteína y agua.' };
  }
  return { label:'Plan del día', text:'Mantén el plan simple: porciones completas y 11 vasos de agua.' };
}

let _alimentacionDraft = null;

function initAlimentacion() {
  _alimentacionDraft = JSON.parse(JSON.stringify(alimentacionObtenerRegistro(fechaHoy())));
  renderAlimentacion();
}

function renderAlimentacion() {
  if (!_alimentacionDraft) _alimentacionDraft = alimentacionObtenerRegistro(fechaHoy());
  const reg = _alimentacionDraft;
  const progreso = alimentacionCalcularProgreso(reg);
  const contexto = alimentacionContextoDelDia(reg.fecha);

  const dayLabel = document.getElementById('food-day-label');
  const contextText = document.getElementById('food-context-text');
  if (dayLabel) dayLabel.textContent = contexto.label;
  if (contextText) contextText.textContent = contexto.text;

  const ring = document.getElementById('food-big-ring');
  const pct = document.getElementById('food-big-pct');
  const sub = document.getElementById('food-progress-sub');
  const note = document.getElementById('food-progress-note');
  if (ring) ring.style.setProperty('--p', progreso.porcentaje);
  if (pct) pct.textContent = progreso.porcentaje + '%';
  if (sub) sub.textContent = `${progreso.gruposCompletos} de ${progreso.totalGrupos} grupos completos`;
  if (note) note.textContent = progreso.diaCompleto ? 'Día completo: porciones y agua cumplidas' : `Agua: ${reg.aguaVasos} / 11 vasos`;

  renderAgua(reg);
  renderPorciones(reg);
  updateAlimentacionDashboard();
}

function renderAgua(reg) {
  const count = document.getElementById('food-water-count');
  const cups = document.getElementById('food-cups');
  if (count) count.textContent = `${reg.aguaVasos} / 11`;
  if (!cups) return;
  cups.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement('button');
    btn.className = 'food-cup' + (i <= reg.aguaVasos ? ' active' : '') + (i > 11 ? ' extra' : '');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Vaso ${i}`);
    btn.onclick = () => alimentacionSetAgua(i);
    btn.innerHTML = alimentacionIcon('water');
    cups.appendChild(btn);
  }
}

function renderPorciones(reg) {
  const list = document.getElementById('food-portion-list');
  if (!list) return;
  list.innerHTML = '';
  ALIMENTACION_GRUPOS.forEach(g => {
    const valor = Number(reg.porciones?.[g.id]) || 0;
    const pct = Math.min(100, Math.round(valor / g.meta * 100));
    const completa = valor >= g.meta;
    const card = document.createElement('div');
    card.className = 'food-portion-card' + (completa ? ' complete' : '');
    card.innerHTML = `
      <div class="food-portion-top">
        <div class="food-portion-icon">${alimentacionIcon(g.icon)}</div>
        <div class="food-portion-copy">
          <div class="food-portion-title">${g.label}</div>
          <div class="food-portion-sub">Meta: ${alimentacionFormatoNumero(g.meta)} ${g.unidad}</div>
        </div>
        <span class="food-portion-status">${completa ? 'Completo' : 'Pendiente'}</span>
      </div>
      <div class="food-portion-control">
        <button type="button" onclick="alimentacionCambiarPorcion('${g.id}', -0.5)">−</button>
        <div class="food-portion-value"><strong>${alimentacionFormatoNumero(valor)}</strong><span>/ ${alimentacionFormatoNumero(g.meta)}</span></div>
        <button type="button" onclick="alimentacionCambiarPorcion('${g.id}', 0.5)">+</button>
      </div>
      <div class="food-portion-bar"><div style="width:${pct}%"></div></div>
    `;
    list.appendChild(card);
  });
}

function alimentacionSetAgua(cupNumber) {
  if (!_alimentacionDraft) _alimentacionDraft = alimentacionObtenerRegistro(fechaHoy());
  const actual = Number(_alimentacionDraft.aguaVasos) || 0;
  _alimentacionDraft.aguaVasos = actual === cupNumber ? cupNumber - 1 : cupNumber;
  renderAlimentacion();
}

function alimentacionCambiarPorcion(grupoId, delta) {
  if (!_alimentacionDraft) _alimentacionDraft = alimentacionObtenerRegistro(fechaHoy());
  const actual = Number(_alimentacionDraft.porciones?.[grupoId]) || 0;
  _alimentacionDraft.porciones[grupoId] = Math.max(0, Math.round((actual + delta) * 10) / 10);
  renderAlimentacion();
}

function alimentacionGuardar() {
  if (!_alimentacionDraft) _alimentacionDraft = alimentacionObtenerRegistro(fechaHoy());
  _alimentacionDraft = alimentacionGuardarRegistro(_alimentacionDraft);
  updateAlimentacionDashboard();
  const p = alimentacionCalcularProgreso(_alimentacionDraft);
  showToast(p.diaCompleto ? '✅ Alimentación completa guardada' : '✅ Alimentación guardada');
}

function updateAlimentacionDashboard() {
  const card = document.getElementById('dash-alimentacion-card');
  if (!card) return;
  const reg = alimentacionObtenerRegistro(fechaHoy());
  const progreso = alimentacionCalcularProgreso(reg);
  const ctx = alimentacionContextoDelDia(reg.fecha);

  const ring = document.getElementById('dash-food-ring');
  const pct = document.getElementById('dash-food-pct');
  const sub = document.getElementById('dash-food-sub');
  const water = document.getElementById('dash-food-water');
  if (ring) ring.style.setProperty('--p', progreso.porcentaje);
  if (pct) pct.textContent = progreso.porcentaje + '%';
  if (sub) sub.textContent = progreso.diaCompleto ? 'Día completo · porciones y agua OK' : `${progreso.gruposCompletos}/7 grupos · ${reg.aguaVasos}/11 vasos`;
  if (water) {
    [...water.querySelectorAll('.food-water-dot')].forEach((dot, idx) => {
      dot.classList.toggle('active', idx < reg.aguaVasos);
      dot.classList.toggle('extra', idx >= 11);
    });
  }
  card.classList.toggle('complete', progreso.diaCompleto);
  card.setAttribute('title', ctx.text);
}

window.initAlimentacion = initAlimentacion;
window.updateAlimentacionDashboard = updateAlimentacionDashboard;
window.alimentacionCambiarPorcion = alimentacionCambiarPorcion;
window.alimentacionSetAgua = alimentacionSetAgua;
window.alimentacionGuardar = alimentacionGuardar;
window.alimentacionObtenerRegistro = alimentacionObtenerRegistro;
window.alimentacionCalcularProgreso = alimentacionCalcularProgreso;
