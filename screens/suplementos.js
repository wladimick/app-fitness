// screens/suplementos.js
// DeFatFit — Pantalla de suplementos

async function renderSuplementos() {
  const container = document.getElementById('screen-suplementos');
  if (!container) return;

  const userId = window.currentUser?.id;

  container.innerHTML =
    UI.topbar({ title: 'Suplementos', subtitle: 'Guía educativa · consulta a tu nutricionista' }) +
    `<div class="screen-content" id="supl-content">${UI.loading('Cargando suplementos…')}</div>`;

  const [catalogo, misSupl] = await Promise.all([
    supplementService.obtenerSuplementos(),
    userId ? supplementService.obtenerSuplementosUsuario(userId) : Promise.resolve([])
  ]);

  const activosIds = new Set(misSupl.map(s => s.suplemento_id));
  const content    = document.getElementById('supl-content');
  if (!content) return;

  content.innerHTML = `
    ${misSupl.length > 0 ? `
      <div class="sec-label">Mis suplementos activos</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${misSupl.map(us => `
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(200,241,53,.08);border:1px solid rgba(200,241,53,.2);border-radius:100px;font-size:13px">
            <span style="color:var(--accent)">✓</span>
            <span>${us.suplementos?.nombre || 'Suplemento'}</span>
            ${us.horario ? `<span style="color:var(--muted);font-size:11px">${us.horario}</span>` : ''}
          </div>`).join('')}
      </div>
    ` : ''}

    <div class="sec-label">Catálogo</div>
    <div class="supl-list">
      ${catalogo.map(s => _renderSuplCard(s, activosIds.has(s.id), misSupl)).join('')}
    </div>

    <div class="card" style="margin-top:16px">
      <p style="font-size:13px;color:var(--muted);line-height:1.5">
        ⚠️ Esta información es solo educativa y no reemplaza la indicación de tu nutricionista o médico.
      </p>
    </div>
    <div style="height:16px"></div>
  `;
}

function _renderSuplCard(supl, activo, misSupl) {
  const miConfig = misSupl.find(s => s.suplemento_id === supl.id);

  return `
    <div class="supl-card">
      <div class="supl-icon">💊</div>
      <div class="supl-info">
        <div class="supl-nombre">${supl.nombre}</div>
        <div class="supl-dosis">${supl.dosis_general || supl.descripcion || ''}</div>
      </div>
      <div class="supl-actions">
        <label class="toggle-switch">
          <input type="checkbox" ${activo ? 'checked' : ''} onchange="toggleSuplementoUsuario('${supl.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
    ${activo ? `
      <div style="background:var(--bg3);border-radius:0 0 var(--r) var(--r);padding:10px 16px;margin-top:-8px;display:flex;gap:8px">
        <input class="form-input" style="flex:1;font-size:13px;padding:8px 12px" type="text"
          placeholder="Dosis personalizada…"
          value="${miConfig?.dosis_personalizada || ''}"
          onchange="guardarConfigSupl('${supl.id}', 'dosis', this.value)">
        <input class="form-input" style="flex:1;font-size:13px;padding:8px 12px" type="text"
          placeholder="Horario (ej: noche)"
          value="${miConfig?.horario || ''}"
          onchange="guardarConfigSupl('${supl.id}', 'horario', this.value)">
      </div>
    ` : ''}`;
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

const _configTimers = {};
async function guardarConfigSupl(suplId, campo, valor) {
  clearTimeout(_configTimers[suplId + campo]);
  _configTimers[suplId + campo] = setTimeout(async () => {
    const userId = window.currentUser?.id;
    if (!userId) return;
    const config = campo === 'dosis' ? { dosis: valor } : { horario: valor };
    await supplementService.toggleSuplemento(userId, suplId, true, config);
  }, 800);
}
