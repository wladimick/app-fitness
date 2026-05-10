// screens/pagos.js
// DeFatFit — Historial de pagos y Mercado Pago (stub Sprint 2)

async function initPagos() {
  const container = document.getElementById('screen-pagos');
  if (!container) return;

  const userId = window.currentUser?.id;

  container.innerHTML =
    UI.topbar({ title: 'Pagos', subtitle: 'Historial de transacciones' }) +
    `<div class="screen-content" id="pagos-content">${UI.loading('Cargando historial…')}</div>`;

  if (!userId) return;

  const { data: pagos, error } = await window.db
    .from('pagos')
    .select('*')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const content = document.getElementById('pagos-content');
  if (!content) return;

  if (error || !pagos || pagos.length === 0) {
    content.innerHTML = UI.empty({
      icon: '💳',
      title: 'Sin transacciones',
      body: 'Aquí aparecerán tus pagos y renovaciones de suscripción.',
      action: `<button class="btn-primary" onclick="goScreen('screen-suscripcion')">Ver planes</button>`,
    });
    return;
  }

  content.innerHTML = `
    <div class="sec-label">Historial</div>
    <div class="card">
      ${pagos.map(p => _renderPago(p)).join('')}
    </div>

    <div class="card" style="margin-top:12px">
      <p style="font-size:13px;color:var(--muted);text-align:center;padding:4px 0">
        🔒 Transacciones procesadas de forma segura por Mercado Pago
      </p>
    </div>
    <div style="height:16px"></div>
  `;
}

function _renderPago(pago) {
  const estado  = pago.estado || 'pendiente';
  const monto   = pago.monto ? `$${Number(pago.monto).toLocaleString('es-CL')}` : '—';
  const fecha   = _formatFecha(pago.created_at?.split('T')[0]);
  const metodo  = pago.metodo || 'Mercado Pago';

  return `
    <div class="pago-historial-item">
      <div>
        <div style="font-size:14px;font-weight:500">${pago.descripcion || 'Suscripción DeFatFit'}</div>
        <div class="pago-info-label">${fecha} · ${metodo}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <span class="pago-monto">${monto}</span>
        <span class="pago-estado ${estado}">${_estadoLabel(estado)}</span>
      </div>
    </div>`;
}

function _estadoLabel(estado) {
  return { aprobado: '✓ Aprobado', pendiente: '⏳ Pendiente', fallido: '✗ Fallido', cancelado: '— Cancelado' }[estado] || estado;
}

function _formatFecha(fecha) {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`;
}

window.initPagos = initPagos;
