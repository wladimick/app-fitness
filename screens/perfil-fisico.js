// screens/perfil-fisico.js
// DeFatFit v7 — Pantalla de perfil físico / Body Pro (conectada a Supabase)

async function renderPerfilFisico() {
  const container = document.getElementById('screen-perfil-fisico');
  if (!container) return;

  const userId = window.currentUser?.id;
  container.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Cargando métricas...</p></div>`;

  const mediciones = await bodyProService.obtenerUltimasMediciones(userId, 2);
  const actual = mediciones[0] || null;
  const anterior = mediciones[1] || null;
  const diff = bodyProService.calcularDiferencia(actual, anterior);

  container.innerHTML = `
    <div class="screen-header">
      <h1>Perfil físico</h1>
      <button class="btn-icon" onclick="mostrarFormularioMedicion()">＋</button>
    </div>

    ${actual ? `
      <div class="card bodypro-actual">
        <div class="bodypro-fecha">Última medición · ${_formatFecha(actual.fecha)}</div>
        <div class="bodypro-metricas-grid">
          ${_renderMetrica('Peso', actual.peso, 'kg', diff.peso)}
          ${_renderMetrica('Grasa corporal', actual.grasa_corporal, '%', diff.grasa_corporal)}
          ${_renderMetrica('Masa muscular', actual.masa_muscular, 'kg', diff.masa_muscular)}
          ${_renderMetrica('Agua corporal', actual.agua_corporal, '%', diff.agua_corporal)}
          ${_renderMetrica('Grasa visceral', actual.grasa_visceral, '', diff.grasa_visceral)}
          ${_renderMetrica('IMC', actual.imc, '', diff.imc)}
          ${_renderMetrica('Metabolismo basal', actual.metabolismo_basal, 'kcal', null)}
          ${_renderMetrica('Edad corporal', actual.edad_corporal, 'años', null)}
        </div>
      </div>
    ` : `
      <div class="card bodypro-vacio">
        <div class="bodypro-vacio-icon">📊</div>
        <div class="bodypro-vacio-texto">Sin mediciones registradas</div>
        <p>Agrega tu primera medición Body Pro para ver tu progreso.</p>
        <button class="btn-primary" onclick="mostrarFormularioMedicion()">Agregar primera medición</button>
      </div>
    `}

    ${anterior ? `
      <div class="bodypro-anterior-label">Medición anterior · ${_formatFecha(anterior.fecha)}</div>
    ` : ''}

    <div id="form-medicion" style="display:none">
      ${_renderFormularioMedicion()}
    </div>

    ${actual ? `
      <button class="btn-secondary btn-nueva-medicion" onclick="mostrarFormularioMedicion()">
        + Nueva medición
      </button>
    ` : ''}
  `;
}

function _renderMetrica(label, valor, unidad, diff) {
  if (valor == null) return `
    <div class="bodypro-metrica vacia">
      <div class="bodypro-metrica-label">${label}</div>
      <div class="bodypro-metrica-valor">—</div>
    </div>
  `;

  const diffHtml = diff ? `
    <div class="bodypro-diff ${parseFloat(diff.delta) > 0 ? 'positivo' : parseFloat(diff.delta) < 0 ? 'negativo' : 'neutro'}">
      ${parseFloat(diff.delta) > 0 ? '▲' : parseFloat(diff.delta) < 0 ? '▼' : '—'} ${Math.abs(diff.delta)} ${unidad}
    </div>
  ` : '';

  return `
    <div class="bodypro-metrica">
      <div class="bodypro-metrica-label">${label}</div>
      <div class="bodypro-metrica-valor">${valor} <span class="bodypro-unidad">${unidad}</span></div>
      ${diffHtml}
    </div>
  `;
}

function _renderFormularioMedicion() {
  const hoy = new Date().toISOString().split('T')[0];
  return `
    <div class="card form-medicion-card">
      <h3>Nueva medición</h3>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Fecha</label>
          <input class="form-input" type="date" id="med-fecha" value="${hoy}">
        </div>
        <div class="form-field">
          <label class="form-label">Peso (kg)</label>
          <input class="form-input" type="number" step="0.1" id="med-peso" placeholder="82.5">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Grasa corporal (%)</label>
          <input class="form-input" type="number" step="0.1" id="med-grasa" placeholder="18.0">
        </div>
        <div class="form-field">
          <label class="form-label">Masa muscular (kg)</label>
          <input class="form-input" type="number" step="0.1" id="med-muscular" placeholder="62.0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Agua corporal (%)</label>
          <input class="form-input" type="number" step="0.1" id="med-agua" placeholder="55.0">
        </div>
        <div class="form-field">
          <label class="form-label">Grasa visceral</label>
          <input class="form-input" type="number" step="0.1" id="med-visceral" placeholder="8.0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">IMC</label>
          <input class="form-input" type="number" step="0.1" id="med-imc" placeholder="24.0">
        </div>
        <div class="form-field">
          <label class="form-label">Metabolismo basal (kcal)</label>
          <input class="form-input" type="number" id="med-metabolismo" placeholder="1800">
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Edad corporal (años)</label>
        <input class="form-input" type="number" id="med-edad-corp" placeholder="28">
      </div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="cancelarFormularioMedicion()">Cancelar</button>
        <button class="btn-primary" onclick="guardarMedicion()">Guardar medición</button>
      </div>
    </div>
  `;
}

function mostrarFormularioMedicion() {
  const form = document.getElementById('form-medicion');
  if (form) {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }
}

function cancelarFormularioMedicion() {
  const form = document.getElementById('form-medicion');
  if (form) form.style.display = 'none';
}

async function guardarMedicion() {
  const userId = window.currentUser?.id;
  if (!userId) return;

  const medicion = {
    fecha: document.getElementById('med-fecha')?.value,
    peso: parseFloat(document.getElementById('med-peso')?.value) || null,
    grasaCorporal: parseFloat(document.getElementById('med-grasa')?.value) || null,
    masaMuscular: parseFloat(document.getElementById('med-muscular')?.value) || null,
    aguaCorporal: parseFloat(document.getElementById('med-agua')?.value) || null,
    grasaVisceral: parseFloat(document.getElementById('med-visceral')?.value) || null,
    imc: parseFloat(document.getElementById('med-imc')?.value) || null,
    metabolismoBasal: parseInt(document.getElementById('med-metabolismo')?.value) || null,
    edadCorporal: parseInt(document.getElementById('med-edad-corp')?.value) || null
  };

  const result = await bodyProService.registrarMedicion(userId, medicion);

  if (result.ok) {
    window.mostrarToast?.('✓ Medición guardada', 'success');
    setTimeout(() => renderPerfilFisico(), 500);
  } else {
    window.mostrarToast?.('Error al guardar: ' + result.error, 'error');
  }
}

function _formatFecha(fecha) {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}
