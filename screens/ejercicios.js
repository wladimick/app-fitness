// screens/ejercicios.js
// DeFatFit — Biblioteca de ejercicios (stub Sprint 2)

async function initEjercicios() {
  const container = document.getElementById('screen-ejercicios');
  if (!container) return;

  container.innerHTML =
    UI.topbar({ title: 'Ejercicios', subtitle: 'Biblioteca de movimientos' }) +
    `<div class="screen-content">
      ${_renderFiltros()}
      <div class="sec-label">Todos los ejercicios</div>
      <div class="ejercicios-biblioteca-list" id="ejercicios-biblioteca-list">
        ${UI.loading('Cargando ejercicios…')}
      </div>
      <div style="height:16px"></div>
    </div>`;

  _cargarEjercicios('todos');
}

function _getEjerciciosList() {
  // ejerciciosDB es un objeto { pecho: [...], espalda: [...], ... }
  if (typeof ejerciciosDB === 'undefined') return [];
  if (Array.isArray(ejerciciosDB)) return ejerciciosDB;
  return Object.entries(ejerciciosDB).flatMap(([grupo, lista]) =>
    (lista || []).map(e => ({ ...e, grupo }))
  );
}

function _renderFiltros() {
  const grupos = typeof ejerciciosDB !== 'undefined' && !Array.isArray(ejerciciosDB)
    ? ['Todos', ...Object.keys(ejerciciosDB).map(g => g.charAt(0).toUpperCase() + g.slice(1))]
    : ['Todos'];
  return `
    <div class="ejercicios-filter-row">
      ${grupos.map((g, i) => `
        <div class="ejercicio-chip ${i === 0 ? 'active' : ''}" onclick="filtrarEjercicios('${g.toLowerCase()}', this)">
          ${g}
        </div>`).join('')}
    </div>`;
}

function filtrarEjercicios(grupo, el) {
  document.querySelectorAll('.ejercicio-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  _cargarEjercicios(grupo);
}

function _cargarEjercicios(grupo) {
  const lista = document.getElementById('ejercicios-biblioteca-list');
  if (!lista) return;

  const todos = _getEjerciciosList();
  const filtrados = grupo === 'todos'
    ? todos
    : todos.filter(e => (e.grupo || '').toLowerCase() === grupo.toLowerCase());

  if (filtrados.length === 0) {
    lista.innerHTML = UI.empty({ icon: '🏋️', title: 'Sin resultados', body: 'No hay ejercicios para ese grupo muscular aún.' });
    return;
  }

  lista.innerHTML = filtrados.map(e => `
    <div class="ejercicio-card" onclick="verDetalleEjercicio('${(e.nombre || '').replace(/'/g, "\\'")}')">
      <div class="ejercicio-icon">${_iconGrupo(e.grupo)}</div>
      <div class="ejercicio-info">
        <div class="ejercicio-nombre">${e.nombre}</div>
        <div class="ejercicio-meta">${e.grupo || ''} ${e.nivel ? '· ' + e.nivel : ''}</div>
      </div>
      <svg class="icon-svg" viewBox="0 0 24 24" style="width:16px;height:16px;color:var(--muted)" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
    </div>`).join('');
}

function verDetalleEjercicio(id) {
  window.mostrarToast?.('Detalle de ejercicio — Sprint 2', 'info');
}

function _iconGrupo(grupo) {
  if (!grupo) return '💪';
  const g = grupo.toLowerCase();
  if (g.includes('pecho'))   return '💪';
  if (g.includes('espalda')) return '🏛';
  if (g.includes('piern'))   return '🦵';
  if (g.includes('hombro'))  return '🔱';
  if (g.includes('bícep') || g.includes('bicep')) return '💎';
  if (g.includes('trícep') || g.includes('tricep')) return '💎';
  if (g.includes('abdomen') || g.includes('core')) return '⬡';
  return '💪';
}

window.initEjercicios      = initEjercicios;
window.filtrarEjercicios   = filtrarEjercicios;
window.verDetalleEjercicio = verDetalleEjercicio;
