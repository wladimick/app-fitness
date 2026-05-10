// DeFatFit v3 — screens/rutina.js

// Estado local
let _editMode  = false;
let _dragSrcIdx = null;
let _planActivo = {}; // { ejId: 'A' | 'B' }

function _getRutina() {
  return window._rutinaHoy;
}

function _saveRutina() {
  saveRutinaLocal(window._rutinaHoy);
  updateDashProgress?.();
}

/* ── Inicializar pantalla ── */
function initRutina() {
  const r = _getRutina();
  if (!r) {
    const titulo = document.getElementById('rutina-titulo');
    const meta = document.getElementById('rutina-meta');
    const list = document.getElementById('ejercicios-list');
    if (titulo) titulo.textContent = 'No tienes rutina asignada para hoy';
    if (meta) meta.innerHTML = `<span class="badge badge-gray">Planifica tu entrenamiento</span>`;
    if (list) list.innerHTML = `<div class="card" style="padding:16px;text-align:center"><p>No tienes rutina asignada para hoy</p><button class="btn-primary" onclick="goScreen('screen-planificador')">Planificar rutina</button><button class="btn-secondary" style="margin-left:8px" onclick="goScreen('screen-ejercicios')">Elegir sesión recomendada</button></div>`;
    return;
  }

  // Header
  const tag = document.getElementById('rutina-dia-tag');
  if (tag) tag.textContent = `📅 HOY · ${diaSemana().toUpperCase()}`;

  const titulo = document.getElementById('rutina-titulo');
  if (titulo) titulo.textContent = r.nombre;

  const meta = document.getElementById('rutina-meta');
  if (meta) meta.innerHTML = `
    <span class="badge badge-green">💪 ${r.nivel}</span>
    <span class="badge badge-blue">⏱ ${r.duracionMinutos} min</span>
    <span class="badge badge-gray">🎯 ${r.grupoPrincipal}</span>
  `;

  renderEjs();
  syncEditUI();
}

/* ── Render ejercicios ── */
function renderEjs() {
  const r    = _getRutina();
  const list = document.getElementById('ejercicios-list');
  if (!list) return;
  list.innerHTML = '';

  r.ejercicios.forEach((ej, i) => {
    const planSelec = _planActivo[ej.id] || 'A';
    const div = document.createElement('div');
    div.className = 'ejercicio-card' +
      (ej.completado ? ' done' : '') +
      (_editMode ? ' edit-mode' : '');
    div.draggable = _editMode;
    div.dataset.idx = i;

    div.innerHTML = `
      <div class="ej-edit-controls">
        <span class="ej-drag-handle" title="Arrastra para reordenar">⠿</span>
        <button class="ej-move-btn" onclick="moverEj(${i},-1)" ${i===0?'disabled':''}>↑</button>
        <button class="ej-move-btn" onclick="moverEj(${i},1)" ${i===r.ejercicios.length-1?'disabled':''}>↓</button>
        <span class="ej-spacer"></span>
        <button class="ej-edit-btn" onclick="abrirEditarEj(${i})">✏️ Editar</button>
        <button class="ej-del-btn"  onclick="eliminarEj(${i})">✕</button>
      </div>
      <div class="ej-top">
        <div>
          <div class="ej-num">Ejercicio ${i+1}</div>
          <div class="ej-name">${ej.nombre}</div>
          <div class="ej-grupo">${ej.grupoMuscular}</div>
        </div>
        <div class="ej-check ${ej.completado ? 'checked' : ''}" onclick="toggleEj(${i})">
          ${ej.completado ? '✓' : ''}
        </div>
      </div>
      ${ej.planB ? `
      <div class="plan-tabs">
        <span class="plan-tab ${planSelec==='A'?'active-a':''}" onclick="setPlan(${ej.id},'A',${i})">Plan A · Máquina</span>
        <span class="plan-tab ${planSelec==='B'?'active-b':''}" onclick="setPlan(${ej.id},'B',${i})">Plan B · ${ej.planB.split(' ')[0]}</span>
      </div>
      ${planSelec==='B' ? `<div class="ej-nota" style="border-left-color:var(--accent2);color:var(--accent2)">🔄 ${ej.planB}</div>` : ''}
      ` : ''}
      <div class="ej-stats">
        <div class="ej-stat"><div class="ej-stat-val">${ej.series}</div><div class="ej-stat-lbl">Series</div></div>
        <div class="ej-stat"><div class="ej-stat-val">${ej.repeticiones}</div><div class="ej-stat-lbl">Reps</div></div>
        <div class="ej-stat"><div class="ej-stat-val">${ej.pesoSugerido}</div><div class="ej-stat-lbl">Peso</div></div>
        <div class="ej-stat"><div class="ej-stat-val">${ej.descansoSegundos}s</div><div class="ej-stat-lbl">Descanso</div></div>
      </div>
      ${ej.nota ? `<div class="ej-nota">💡 ${ej.nota}</div>` : ''}
    `;

    // Drag events
    if (_editMode) {
      div.addEventListener('dragstart', e => {
        _dragSrcIdx = i;
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        document.querySelectorAll('.ejercicio-card').forEach(c => c.classList.remove('drag-over'));
      });
      div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('drag-over'); });
      div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
      div.addEventListener('drop', e => {
        e.preventDefault();
        div.classList.remove('drag-over');
        if (_dragSrcIdx !== null && _dragSrcIdx !== i) {
          const r2 = _getRutina();
          const [moved] = r2.ejercicios.splice(_dragSrcIdx, 1);
          r2.ejercicios.splice(i, 0, moved);
          _dragSrcIdx = null;
          _saveRutina();
          renderEjs();
          showToast('Ejercicio reordenado');
        }
      });
    }

    list.appendChild(div);
  });

  updateDashProgress?.();
}

function setPlan(ejId, plan, idx) {
  _planActivo[ejId] = plan;
  renderEjs();
}

/* ── Toggle completado ── */
function toggleEj(idx) {
  if (_editMode) return;
  const r  = _getRutina();
  const ej = r.ejercicios[idx];
  const wasComp = ej.completado;
  ej.completado = !wasComp;
  _saveRutina();
  renderEjs();
  if (!wasComp) {
    iniciarTimer(ej.descansoSegundos || 60);
    const done = r.ejercicios.filter(e => e.completado).length;
    if (done === r.ejercicios.length)
      setTimeout(() => showToast('🎉 ¡Rutina completada! Excelente trabajo.'), 400);
  }
}

/* ── Editar ── */
function syncEditUI() {
  const bar    = document.getElementById('edit-mode-bar');
  const addBtn = document.getElementById('add-ej-btn');
  const editBtn= document.getElementById('btn-toggle-edit');
  bar?.classList.toggle('active', _editMode);
  addBtn?.classList.toggle('visible', _editMode);
  if (editBtn) editBtn.textContent = _editMode ? '✓ Listo' : '✏️ Editar rutina';
}

function toggleEditMode() {
  _editMode = !_editMode;
  renderEjs();
  syncEditUI();
  if (!_editMode) showToast('💾 Rutina guardada');
}

function moverEj(idx, dir) {
  const r = _getRutina();
  const n = idx + dir;
  if (n < 0 || n >= r.ejercicios.length) return;
  [r.ejercicios[idx], r.ejercicios[n]] = [r.ejercicios[n], r.ejercicios[idx]];
  _saveRutina();
  renderEjs();
}

function eliminarEj(idx) {
  const r = _getRutina();
  if (r.ejercicios.length <= 1) { showToast('La rutina necesita al menos 1 ejercicio'); return; }
  r.ejercicios.splice(idx, 1);
  _saveRutina();
  renderEjs();
  showToast('Ejercicio eliminado');
}

function abrirEditarEj(idx) {
  const ej = _getRutina().ejercicios[idx];
  document.getElementById('edit-ej-idx').value    = idx;
  document.getElementById('edit-nombre').value    = ej.nombre;
  document.getElementById('edit-grupo').value     = ej.grupoMuscular;
  document.getElementById('edit-series').value    = ej.series;
  document.getElementById('edit-reps').value      = ej.repeticiones;
  document.getElementById('edit-peso').value      = ej.pesoSugerido;
  document.getElementById('edit-descanso').value  = ej.descansoSegundos;
  document.getElementById('edit-nota').value      = ej.nota || '';
  openOverlay('modal-edit-ej');
}

function guardarEjercicio() {
  const idx = parseInt(document.getElementById('edit-ej-idx').value);
  const ej  = _getRutina().ejercicios[idx];
  ej.nombre           = document.getElementById('edit-nombre').value.trim()   || ej.nombre;
  ej.grupoMuscular    = document.getElementById('edit-grupo').value.trim()    || ej.grupoMuscular;
  ej.series           = parseInt(document.getElementById('edit-series').value) || ej.series;
  ej.repeticiones     = document.getElementById('edit-reps').value.trim()     || ej.repeticiones;
  ej.pesoSugerido     = document.getElementById('edit-peso').value.trim()     || ej.pesoSugerido;
  ej.descansoSegundos = parseInt(document.getElementById('edit-descanso').value) || ej.descansoSegundos;
  ej.nota             = document.getElementById('edit-nota').value.trim()     || null;
  _saveRutina();
  closeOverlay('modal-edit-ej');
  renderEjs();
  showToast('✅ Ejercicio actualizado');
}

/* ── Agregar ejercicio ── */
function abrirAgregarEjercicio() {
  const lista = document.getElementById('add-ej-lista');
  const todos = Object.values(ejerciciosDB).flat();
  lista.innerHTML = todos.map(e => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:14px;font-weight:600">${e.nombre}</div>
        <div style="font-size:12px;color:var(--muted)">${e.grupoMuscular} · ${e.series}×${e.repeticiones}</div>
        ${e.planB ? `<div style="font-size:11px;color:var(--accent2);margin-top:2px">Plan B: ${e.planB}</div>` : ''}
      </div>
      <button class="btn-secondary" style="padding:7px 14px;font-size:12px;flex-shrink:0" onclick="agregarDesdeLista(${e.id})">＋</button>
    </div>
  `).join('');
  document.getElementById('new-ej-nombre').value = '';
  openOverlay('modal-add-ej');
}

function agregarDesdeLista(ejId) {
  const ej = Object.values(ejerciciosDB).flat().find(e => e.id === ejId);
  if (!ej) return;
  _getRutina().ejercicios.push({ ...ej, completado: false });
  _saveRutina();
  closeOverlay('modal-add-ej');
  renderEjs();
  showToast('✅ ' + ej.nombre + ' agregado');
}

function crearEjercicioNuevo() {
  const nombre = document.getElementById('new-ej-nombre').value.trim();
  if (!nombre) { showToast('Escribe un nombre'); return; }
  _getRutina().ejercicios.push({
    id: Date.now(),
    nombre,
    grupoMuscular: 'General',
    series:        parseInt(document.getElementById('new-ej-series').value) || 3,
    repeticiones:  document.getElementById('new-ej-reps').value.trim() || '10-12',
    pesoSugerido:  document.getElementById('new-ej-peso').value.trim() || 'Libre',
    descansoSegundos: parseInt(document.getElementById('new-ej-descanso').value) || 60,
    nota: null,
    planB: null,
    completado: false,
  });
  _saveRutina();
  closeOverlay('modal-add-ej');
  renderEjs();
  showToast('✅ ' + nombre + ' agregado');
}

/* ── Acciones generales ── */
function resetRutina() {
  if (_editMode) toggleEditMode();
  _getRutina().ejercicios.forEach(e => e.completado = false);
  _saveRutina();
  renderEjs();
  showToast('Rutina reiniciada');
}

function completarRutina() {
  _getRutina().ejercicios.forEach(e => e.completado = true);
  _saveRutina();
  renderEjs();
  showToast('✅ Rutina completada y guardada');
}

function cargarYVerRutina(clave) {
  const r = rutinasBase[clave];
  if (!r) return;
  window._rutinaHoy = { ...r, ejercicios: r.ejercicios.map(e => ({ ...e, completado: false })) };
  _saveRutina();
  showToast('📋 ' + r.nombre + ' cargada');
  setTimeout(() => goScreen('screen-rutina'), 600);
}

/* ── Timer ── */
let _timerInterval = null, _timerTotal = 0, _timerLeft = 0;
const CIRCUM = 2 * Math.PI * 24;

function iniciarTimer(seg) {
  clearInterval(_timerInterval);
  _timerTotal = seg;
  _timerLeft  = seg;
  _actualizarTimerUI();
  document.getElementById('rest-timer').classList.add('show');
  _timerInterval = setInterval(() => {
    _timerLeft--;
    if (_timerLeft <= 0) {
      _timerLeft = 0;
      _actualizarTimerUI();
      clearInterval(_timerInterval);
      setTimeout(() => {
        document.getElementById('rest-timer').classList.remove('show');
        showToast('⚡ ¡A por el siguiente!');
      }, 800);
      return;
    }
    _actualizarTimerUI();
  }, 1000);
}

function _actualizarTimerUI() {
  const disp = document.getElementById('timer-display');
  const ring = document.getElementById('timer-ring-fg');
  if (!disp || !ring) return;
  const m = Math.floor(_timerLeft / 60), s = _timerLeft % 60;
  disp.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  ring.style.strokeDashoffset = CIRCUM * (1 - _timerLeft / _timerTotal);
  disp.className = 'timer-count' + (_timerLeft <= 10 ? ' warning' : '');
  ring.style.stroke = _timerLeft <= 10 ? 'var(--orange)' : 'var(--accent)';
}

function skipTimer() {
  clearInterval(_timerInterval);
  document.getElementById('rest-timer').classList.remove('show');
}

// Exponer globalmente
window.initRutina        = initRutina;
window.toggleEditMode    = toggleEditMode;
window.toggleEj          = toggleEj;
window.moverEj           = moverEj;
window.eliminarEj        = eliminarEj;
window.abrirEditarEj     = abrirEditarEj;
window.guardarEjercicio  = guardarEjercicio;
window.abrirAgregarEjercicio = abrirAgregarEjercicio;
window.agregarDesdeLista = agregarDesdeLista;
window.crearEjercicioNuevo = crearEjercicioNuevo;
window.resetRutina       = resetRutina;
window.completarRutina   = completarRutina;
window.cargarYVerRutina  = cargarYVerRutina;
window.setPlan           = setPlan;
window.skipTimer         = skipTimer;
window.iniciarTimer      = iniciarTimer;
