// screens/suplementos.js
// DeFatFit v7 — Pantalla de suplementos

async function renderSuplementos() {
  const container = document.getElementById('screen-suplementos');
  if (!container) return;

  const userId = window.currentUser?.id;
  container.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Cargando suplementos...</p></div>`;

  const [catalogo, misSupl] = await Promise.all([
    supplementService.obtenerSuplementos(),
    userId ? supplementService.obtenerSuplementosUsuario(userId) : Promise.resolve([])
  ]);

  const activosIds = new Set(misSupl.map(s => s.suplemento_id));

  container.innerHTML = `
    <div class="screen-header">
      <h1>Suplementos</h1>
      <p class="screen-subtitle">Información educativa. Siempre valida con tu nutricionista.</p>
    </div>

    ${misSupl.length > 0 ? `
      <div class="supl-seccion">
        <h2 class="supl-seccion-titulo">Mis suplementos activos</h2>
        <div class="supl-activos-grid">
          ${misSupl.map(us => _renderSuplActivoChip(us)).join('')}
        </div>
      </div>
    ` : ''}

    <div class="supl-seccion">
      <h2 class="supl-seccion-titulo">Catálogo</h2>
      <div class="supl-cards">
        ${catalogo.map(s => _renderSuplCard(s, activosIds.has(s.id), misSupl)).join('')}
      </div>
    </div>

    <div class="supl-disclaimer">
      <p>⚠️ Esta información es solo educativa y no reemplaza la indicación de tu nutricionista o médico. Siempre consulta antes de comenzar cualquier suplementación.</p>
    </div>
  `;
}

function _renderSuplActivoChip(usuarioSupl) {
  const nombre = usuarioSupl.suplementos?.nombre || 'Suplemento';
  return `
    <div class="supl-chip-activo">
      <span>✓ ${nombre}</span>
      ${usuarioSupl.horario ? `<small>${usuarioSupl.horario}</small>` : ''}
    </div>
  `;
}

function _renderSuplCard(supl, activo, misSupl) {
  const miConfig = misSupl.find(s => s.suplemento_id === supl.id);

  return `
    <div class="supl-card ${activo ? 'supl-activo' : ''}">
      <div class="supl-card-header">
        <div class="supl-nombre">${supl.nombre}</div>
        <label class="supl-toggle">
          <input type="checkbox" ${activo ? 'checked' : ''}
            onchange="toggleSuplementoUsuario('${supl.id}', this.checked)">
          <span class="supl-toggle-track"></span>
        </label>
      </div>

      <div class="supl-descripcion">${supl.descripcion || ''}</div>

      <div class="supl-detalle-grid">
        <div class="supl-detalle-item">
          <div class="supl-detalle-label">¿Para qué sirve?</div>
          <div class="supl-detalle-valor">${supl.para_que_sirve || '—'}</div>
        </div>
        <div class="supl-detalle-item">
          <div class="supl-detalle-label">¿Cómo tomarlo?</div>
          <div class="supl-detalle-valor">${supl.como_tomarlo || '—'}</div>
        </div>
        <div class="supl-detalle-item">
          <div class="supl-detalle-label">Dosis general</div>
          <div class="supl-detalle-valor">${supl.dosis_general || '—'}</div>
        </div>
      </div>

      ${supl.advertencia ? `
        <div class="supl-advertencia">
          ⚠️ ${supl.advertencia}
        </div>
      ` : ''}

      ${activo ? `
        <div class="supl-mi-config">
          <div class="supl-config-label">Mi configuración</div>
          <div class="supl-config-inputs">
            <input class="form-input supl-input-dosis" type="text"
              placeholder="Dosis personalizada..."
              value="${miConfig?.dosis_personalizada || ''}"
              onchange="guardarConfigSupl('${supl.id}', 'dosis', this.value)">
            <input class="form-input supl-input-horario" type="text"
              placeholder="Horario (ej: noche)"
              value="${miConfig?.horario || ''}"
              onchange="guardarConfigSupl('${supl.id}', 'horario', this.value)">
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

async function toggleSuplementoUsuario(suplId, activo) {
  const userId = window.currentUser?.id;
  if (!userId) return;

  const result = await supplementService.toggleSuplemento(userId, suplId, activo);

  if (result.ok) {
    window.mostrarToast?.(activo ? 'Suplemento agregado' : 'Suplemento removido', 'success');
    setTimeout(() => renderSuplementos(), 500);
  } else {
    window.mostrarToast?.('Error al actualizar suplemento', 'error');
  }
}

// Guarda cambios en config del suplemento (con debounce)
const _configTimers = {};
async function guardarConfigSupl(suplId, campo, valor) {
  clearTimeout(_configTimers[suplId + campo]);
  _configTimers[suplId + campo] = setTimeout(async () => {
    const userId = window.currentUser?.id;
    if (!userId) return;

    const config = {};
    if (campo === 'dosis') config.dosis = valor;
    if (campo === 'horario') config.horario = valor;

    await supplementService.toggleSuplemento(userId, suplId, true, config);
  }, 800);
}
