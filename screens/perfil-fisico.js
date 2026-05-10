// screens/perfil-fisico.js
// DeFatFit — Pantalla Body Pro (conectada a Supabase)

async function renderPerfilFisico() {
  const container = document.getElementById('screen-perfil');
  if (!container) return;

  const userId = window.currentUser?.id;
  container.innerHTML =
    UI.topbar({ title: 'Body Pro', subtitle: 'Seguimiento físico', actions: `
      <button class="icon-btn" onclick="mostrarFormularioMedicion()" aria-label="Agregar medición">
        <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      </button>` }) +
    `<div class="screen-content" id="bodypro-content">${UI.loading('Cargando métricas…')}</div>`;

  const mediciones = await bodyProService.obtenerUltimasMediciones(userId, 2);
  const actual   = mediciones[0] || null;
  const anterior = mediciones[1] || null;
  const diff     = bodyProService.calcularDiferencia(actual, anterior);

  const content = document.getElementById('bodypro-content');
  if (!content) return;

  if (!actual) {
    content.innerHTML = UI.empty({
      icon: '📊',
      title: 'Sin mediciones',
      body: 'Agrega tu primera medición Body Pro para ver tu composición corporal.',
      action: `<button class="btn-primary" onclick="mostrarFormularioMedicion()">Agregar primera medición</button>`,
    }) + `<div id="form-medicion" style="display:none">${_renderFormularioMedicion()}</div>`;
    return;
  }

  content.innerHTML = `
    <div class="card bodypro-actual">
      <div class="bodypro-fecha">Última medición · ${_formatFecha(actual.fecha)}</div>
      <div class="bodypro-metricas-grid">
        ${_renderMetrica('Peso',             actual.peso,              'kg',   diff.peso)}
        ${_renderMetrica('Grasa corporal',   actual.grasa_corporal,    '%',    diff.grasa_corporal)}
        ${_renderMetrica('Masa muscular',    actual.masa_muscular,     'kg',   diff.masa_muscular)}
        ${_renderMetrica('Agua corporal',    actual.agua_corporal,     '%',    diff.agua_corporal)}
        ${_renderMetrica('Grasa visceral',   actual.grasa_visceral,    '',     diff.grasa_visceral)}
        ${_renderMetrica('IMC',              actual.imc,               '',     diff.imc)}
        ${_renderMetrica('Metabolismo basal',actual.metabolismo_basal, 'kcal', null)}
        ${_renderMetrica('Edad corporal',    actual.edad_corporal,     'años', null)}
      </div>
    </div>

    ${anterior ? `<div class="bodypro-anterior-label">Medición anterior · ${_formatFecha(anterior.fecha)}</div>` : ''}

    <button class="btn-secondary btn-nueva-medicion" onclick="mostrarFormularioMedicion()">+ Nueva medición</button>

    <div id="form-medicion" style="display:none">${_renderFormularioMedicion()}</div>
  `;
}

function _renderMetrica(label, valor, unidad, diff) {
  if (valor == null) return `
    <div class="bodypro-metrica vacia">
      <div class="bodypro-metrica-label">${label}</div>
      <div class="bodypro-metrica-valor">—</div>
    </div>`;

  const delta = diff ? parseFloat(diff.delta) : null;
  const diffHtml = diff ? `
    <div class="bodypro-diff ${delta > 0 ? 'positivo' : delta < 0 ? 'negativo' : 'neutro'}">
      ${delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} ${Math.abs(diff.delta)} ${unidad}
    </div>` : '';

  return `
    <div class="bodypro-metrica">
      <div class="bodypro-metrica-label">${label}</div>
      <div class="bodypro-metrica-valor">${valor} <span class="bodypro-unidad">${unidad}</span></div>
      ${diffHtml}
    </div>`;
}

function _renderFormularioMedicion() {
  const hoy = new Date().toISOString().split('T')[0];
  return `
    <div class="card form-medicion-card">
      <h3>Nueva medición</h3>
      <div class="form-row">
        ${UI.field({ label: 'Fecha',        input: UI.input({ id: 'med-fecha',      type: 'date',   value: hoy }) })}
        ${UI.field({ label: 'Peso (kg)',     input: UI.input({ id: 'med-peso',       type: 'number', step: '0.1', placeholder: '82.5' }) })}
      </div>
      <div class="form-row">
        ${UI.field({ label: 'Grasa corporal (%)',  input: UI.input({ id: 'med-grasa',     type: 'number', step: '0.1', placeholder: '18.0' }) })}
        ${UI.field({ label: 'Masa muscular (kg)',  input: UI.input({ id: 'med-muscular',  type: 'number', step: '0.1', placeholder: '62.0' }) })}
      </div>
      <div class="form-row">
        ${UI.field({ label: 'Agua corporal (%)',   input: UI.input({ id: 'med-agua',      type: 'number', step: '0.1', placeholder: '55.0' }) })}
        ${UI.field({ label: 'Grasa visceral',      input: UI.input({ id: 'med-visceral',  type: 'number', step: '0.1', placeholder: '8.0' }) })}
      </div>
      <div class="form-row">
        ${UI.field({ label: 'IMC',                 input: UI.input({ id: 'med-imc',       type: 'number', step: '0.1', placeholder: '24.0' }) })}
        ${UI.field({ label: 'Metabolismo basal (kcal)', input: UI.input({ id: 'med-metabolismo', type: 'number', placeholder: '1800' }) })}
      </div>
      ${UI.field({ label: 'Edad corporal (años)', input: UI.input({ id: 'med-edad-corp', type: 'number', placeholder: '28' }) })}
      <div class="form-actions">
        <button class="btn-secondary" onclick="cancelarFormularioMedicion()">Cancelar</button>
        <button class="btn-primary"   onclick="guardarMedicion()">Guardar medición</button>
      </div>
    </div>`;
}

function mostrarFormularioMedicion() {
  const form = document.getElementById('form-medicion');
  if (form) { form.style.display = 'block'; form.scrollIntoView({ behavior: 'smooth' }); }
}

function cancelarFormularioMedicion() {
  const form = document.getElementById('form-medicion');
  if (form) form.style.display = 'none';
}

async function guardarMedicion() {
  const userId = window.currentUser?.id;
  if (!userId) return;

  const medicion = {
    fecha:           document.getElementById('med-fecha')?.value,
    peso:            parseFloat(document.getElementById('med-peso')?.value)        || null,
    grasaCorporal:   parseFloat(document.getElementById('med-grasa')?.value)       || null,
    masaMuscular:    parseFloat(document.getElementById('med-muscular')?.value)    || null,
    aguaCorporal:    parseFloat(document.getElementById('med-agua')?.value)        || null,
    grasaVisceral:   parseFloat(document.getElementById('med-visceral')?.value)    || null,
    imc:             parseFloat(document.getElementById('med-imc')?.value)         || null,
    metabolismoBasal:parseInt(document.getElementById('med-metabolismo')?.value)   || null,
    edadCorporal:    parseInt(document.getElementById('med-edad-corp')?.value)     || null,
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
