// screens/calendario.js
// DeFatFit — Pantalla de calendario (conectada a Supabase)

let _calendarioAnio = new Date().getFullYear();
let _calendarioMes  = new Date().getMonth() + 1; // 1-12
let _calendarioDatos = [];

async function renderCalendario() {
  const container = document.getElementById('screen-calendario');
  if (!container) return;

  const userId = window.currentUser?.id;

  container.innerHTML =
    UI.topbar({ title: 'Calendario', subtitle: 'Tu planificación mensual' }) +
    `<div class="screen-content">
       <div id="calendario-contenido">${UI.loading()}</div>
     </div>`;

  await _cargarYRenderCalendario(userId);
}

async function _cargarYRenderCalendario(userId) {
  _calendarioDatos = await exerciseService.obtenerPlanificacionMes(userId, _calendarioAnio, _calendarioMes);

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const contenido = document.getElementById('calendario-contenido');
  if (!contenido) return;

  const hoy = new Date().toISOString().split('T')[0];

  contenido.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" onclick="navegarCalendario(-1)">‹</button>
      <div class="cal-mes-titulo">${meses[_calendarioMes - 1]} ${_calendarioAnio}</div>
      <button class="cal-nav-btn" onclick="navegarCalendario(1)">›</button>
    </div>

    <div class="cal-leyenda">
      <span class="cal-leyenda-item completado">Completado</span>
      <span class="cal-leyenda-item pendiente">Pendiente</span>
      <span class="cal-leyenda-item descanso">Descanso</span>
      <span class="cal-leyenda-item perdido">Perdido</span>
    </div>

    <div class="cal-grid">
      <div class="cal-dia-label">Lun</div>
      <div class="cal-dia-label">Mar</div>
      <div class="cal-dia-label">Mié</div>
      <div class="cal-dia-label">Jue</div>
      <div class="cal-dia-label">Vie</div>
      <div class="cal-dia-label">Sáb</div>
      <div class="cal-dia-label">Dom</div>
      ${_generarCeldas(hoy)}
    </div>

    <div id="cal-detalle-dia" class="cal-detalle" style="display:none"></div>

    <div class="cal-semana-resumen">
      <h3>Esta semana</h3>
      ${_renderResumenSemana(hoy)}
    </div>
  `;
}

function _generarCeldas(hoy) {
  const primerDia   = new Date(_calendarioAnio, _calendarioMes - 1, 1);
  const diasEnMes   = new Date(_calendarioAnio, _calendarioMes, 0).getDate();
  let inicioOffset  = primerDia.getDay() - 1;
  if (inicioOffset < 0) inicioOffset = 6;

  let html = '';
  for (let i = 0; i < inicioOffset; i++) html += '<div class="cal-celda vacia"></div>';

  for (let d = 1; d <= diasEnMes; d++) {
    const fecha    = `${_calendarioAnio}-${String(_calendarioMes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const diaData  = _calendarioDatos.find(dia => dia.fecha === fecha);
    const estado   = diaData?.estado || '';
    const esHoy    = fecha === hoy;
    const esPasado = fecha < hoy;

    let clases = 'cal-celda';
    if (esHoy)  clases += ' hoy';
    if (estado) clases += ` ${estado}`;
    else if (esPasado) clases += ' sin-registro';

    html += `
      <div class="${clases}" onclick="verDetalleDia('${fecha}', '${diaData?.id || ''}')">
        <span class="cal-dia-num">${d}</span>
        ${_estadoIcon(estado) ? `<span class="cal-estado-icon">${_estadoIcon(estado)}</span>` : ''}
      </div>`;
  }
  return html;
}

function _estadoIcon(estado) {
  return { completado: '✓', descanso: '😴', perdido: '✗', pendiente: '·' }[estado] || '';
}

function _estadoLabel(estado) {
  return {
    completado: '✓ Completado',
    pendiente:  '📅 Pendiente',
    descanso:   '😴 Descanso',
    perdido:    '✗ Perdido',
    reprogramado: '↩ Reprogramado',
  }[estado] || estado;
}

async function verDetalleDia(fecha, planId) {
  const detalle = document.getElementById('cal-detalle-dia');
  if (!detalle) return;

  const diaData = _calendarioDatos.find(d => d.fecha === fecha);

  if (!diaData) {
    detalle.style.display = 'block';
    detalle.innerHTML = `
      <div class="cal-detalle-header">
        <strong>${_formatFecha(fecha)}</strong>
        <button class="icon-btn" onclick="cerrarDetalleDia()">✕</button>
      </div>
      <div class="cal-detalle-sin-rutina">
        <p>Sin rutina asignada para este día.</p>
        <button class="btn-secondary btn-sm" onclick="marcarDescanso('${fecha}')">Marcar como descanso</button>
      </div>`;
    detalle.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  detalle.style.display = 'block';
  detalle.innerHTML = `
    <div class="cal-detalle-header">
      <strong>${_formatFecha(fecha)}</strong>
      <button class="icon-btn" onclick="cerrarDetalleDia()">✕</button>
    </div>
    <div class="cal-detalle-rutina">
      <div class="cal-detalle-nombre">${diaData.rutinas?.nombre || 'Rutina'}</div>
      <div class="cal-detalle-grupo">${diaData.rutinas?.grupo_principal || ''}</div>
      ${diaData.rutinas?.duracion_minutos ? `<div class="cal-detalle-duracion">⏱ ${diaData.rutinas.duracion_minutos} min</div>` : ''}
      <div class="cal-detalle-estado estado-${diaData.estado}">${_estadoLabel(diaData.estado)}</div>
    </div>
    <div class="cal-detalle-acciones">
      ${diaData.estado !== 'completado' ? `<button class="btn-primary btn-sm" onclick="irARutinaDia('${fecha}','${diaData.rutina_id || ''}')">Ver rutina</button>` : ''}
      ${diaData.estado === 'pendiente'  ? `<button class="btn-secondary btn-sm" onclick="marcarDescanso('${fecha}')">Descanso</button>` : ''}
    </div>`;
  detalle.scrollIntoView({ behavior: 'smooth' });
}

function cerrarDetalleDia() {
  const detalle = document.getElementById('cal-detalle-dia');
  if (detalle) detalle.style.display = 'none';
}

async function marcarDescanso(fecha) {
  const userId = window.currentUser?.id;
  const result = await exerciseService.actualizarEstadoDia(userId, fecha, 'descanso');
  if (result.ok) {
    window.mostrarToast?.('Día marcado como descanso', 'success');
    cerrarDetalleDia();
    await _cargarYRenderCalendario(userId);
  }
}

function irARutinaDia(fecha, rutinaId) {
  cerrarDetalleDia();
  if (window.router) window.router.navigate('rutina', { fecha, rutinaId });
  else mostrarScreen('screen-rutina');
}

async function navegarCalendario(delta) {
  _calendarioMes += delta;
  if (_calendarioMes > 12) { _calendarioMes = 1;  _calendarioAnio++; }
  if (_calendarioMes < 1)  { _calendarioMes = 12; _calendarioAnio--; }
  await _cargarYRenderCalendario(window.currentUser?.id);
}

function _renderResumenSemana(hoy) {
  const inicioSemana = new Date(hoy);
  const dia    = inicioSemana.getDay();
  const offset = dia === 0 ? 6 : dia - 1;
  inicioSemana.setDate(inicioSemana.getDate() - offset);

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    dias.push(d.toISOString().split('T')[0]);
  }

  return `
    <div class="cal-semana-chips">
      ${dias.map(fecha => {
        const diaData = _calendarioDatos.find(d => d.fecha === fecha);
        const estado  = diaData?.estado || '';
        const num     = fecha.split('-')[2];
        return `
          <div class="cal-semana-chip ${estado}" onclick="verDetalleDia('${fecha}','${diaData?.id || ''}')">
            <span>${num}</span>
            <span>${_estadoIcon(estado) || '·'}</span>
          </div>`;
      }).join('')}
    </div>`;
}

function _formatFecha(fecha) {
  const [y, m, d] = fecha.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
}
