// screens/suscripcion.js
// DeFatFit — Pantalla de suscripción y planes

async function renderSuscripcion() {
  const container = document.getElementById('screen-suscripcion');
  if (!container) return;

  const userId = window.currentUser?.id;
  if (!userId) return;

  container.innerHTML =
    UI.topbar({ title: 'Suscripción', subtitle: 'Planes y acceso' }) +
    `<div class="screen-content" id="suscripcion-content">${UI.loading('Cargando planes…')}</div>`;

  const [suscripcion, planes] = await Promise.all([
    subscriptionService.obtenerSuscripcionActual(userId),
    subscriptionService.obtenerPlanes()
  ]);

  const tieneAcceso   = suscripcion?.acceso_activo;
  const diasRestantes = subscriptionService.diasRestantes();

  const content = document.getElementById('suscripcion-content');
  if (!content) return;

  content.innerHTML = `
    ${suscripcion ? `
      <div class="suscripcion-activa">
        <div class="suscripcion-activa-label">${_estadoBadge(suscripcion.estado)}</div>
        <div class="suscripcion-activa-plan">${suscripcion.plan_nombre || suscripcion.plan_id}</div>
        ${tieneAcceso ? `
          <div style="font-size:14px;color:var(--muted);margin-top:4px">
            ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''} ·
            Vence el ${_formatFecha(suscripcion.fecha_termino)}
          </div>` : `
          <div style="font-size:14px;color:var(--red);margin-top:4px">⚠️ Tu acceso ha vencido.</div>`}
      </div>
    ` : `
      <div class="card" style="text-align:center;padding:24px;margin-bottom:16px">
        <div style="font-size:36px;margin-bottom:12px">🔓</div>
        <div style="font-family:var(--font-d);font-size:20px;letter-spacing:.5px;margin-bottom:8px">Sin suscripción activa</div>
        <p style="font-size:14px;color:var(--muted)">Activa tu prueba gratuita de 15 días para empezar.</p>
      </div>
    `}

    <div class="sec-label">${tieneAcceso ? 'Planes disponibles' : 'Elige un plan'}</div>
    ${planes.map(plan => _renderPlanCard(plan, suscripcion)).join('')}

    <div class="card" style="margin-top:8px">
      <p style="font-size:13px;color:var(--muted);text-align:center;padding:4px 0">
        🔒 Pagos seguros. Los datos de tu tarjeta nunca se almacenan en nuestros servidores.
      </p>
    </div>
    <div style="height:16px"></div>
  `;
}

function _renderPlanCard(plan, suscripcionActual) {
  const esPlanActual = suscripcionActual?.plan_id === plan.id && suscripcionActual?.acceso_activo;
  const esTrial      = plan.es_trial;
  const precio       = plan.precio_clp === 0 ? 'Gratis' : plan.precio_clp != null ? `$${plan.precio_clp.toLocaleString('es-CL')} CLP` : 'Consultar';

  return `
    <div class="plan-card ${esPlanActual ? 'plan-actual' : ''} ${plan.es_destacado ? 'destacado' : ''}">
      ${esTrial      ? `<div class="plan-card-badge">GRATIS</div>` : ''}
      ${esPlanActual ? `<div class="plan-card-badge">Actual</div>` : ''}
      <div class="plan-nombre">${plan.nombre}</div>
      ${plan.descripcion ? `<p style="font-size:13px;color:var(--muted);margin:6px 0 10px">${plan.descripcion}</p>` : ''}
      <div style="margin-bottom:14px">
        <span class="plan-precio">${precio}</span>
        ${!esTrial && plan.precio_clp ? `<span class="plan-precio-periodo">/ ${plan.duracion_dias} días</span>` : ''}
      </div>
      ${!esPlanActual ? `
        <button class="btn-primary" style="width:100%;justify-content:center" onclick="seleccionarPlan('${plan.id}', ${!!esTrial})">
          ${esTrial ? 'Activar prueba gratis' : 'Elegir este plan'}
        </button>` : `
        <div style="text-align:center;font-size:14px;color:var(--accent);font-weight:500">✓ Plan activo</div>`}
    </div>`;
}

async function seleccionarPlan(planId, esTrial) {
  const userId = window.currentUser?.id;
  if (!userId) return;

  if (esTrial) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Activando…';
    const result = await subscriptionService.activarTrial(userId);
    if (result.ok) {
      window.mostrarToast?.('✓ ¡Prueba activada! Tienes 15 días de acceso completo.', 'success');
      setTimeout(() => { if (window.router) window.router.navigate('inicio'); else renderSuscripcion(); }, 1500);
    } else {
      btn.disabled = false;
      btn.textContent = 'Activar prueba gratis';
      window.mostrarToast?.('Error al activar la prueba.', 'error');
    }
    return;
  }
  _mostrarOpcionesPago(planId);
}

function _mostrarOpcionesPago(planId) {
  const modal = document.createElement('div');
  modal.className = 'overlay';
  modal.id = 'modal-pago';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="bottom-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">Método de pago</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
        <button class="btn-secondary" style="justify-content:flex-start;gap:12px" onclick="iniciarPagoMP('${planId}')">💳 Mercado Pago</button>
        <button class="btn-secondary" style="justify-content:flex-start;gap:12px" onclick="iniciarPagoPayPal('${planId}')">🅿 PayPal</button>
        <button class="btn-ghost"     style="justify-content:flex-start;gap:12px;color:var(--muted)" onclick="iniciarPagoManual('${planId}')">🧪 Simular pago (MVP)</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function iniciarPagoMP(planId) {
  document.getElementById('modal-pago')?.remove();
  window.mostrarToast?.('Conectando con Mercado Pago…', 'info');
  const result = await paymentService.crearPreferenciaMercadoPago(planId);
  if (result.ok && result.initPoint) window.open(result.initPoint, '_blank');
  else window.mostrarToast?.('Edge Function de Mercado Pago aún no configurada.', 'error');
}

async function iniciarPagoPayPal(planId) {
  document.getElementById('modal-pago')?.remove();
  window.mostrarToast?.('Conectando con PayPal…', 'info');
  const result = await paymentService.crearSuscripcionPayPal(planId);
  if (result.ok && result.approveUrl) window.open(result.approveUrl, '_blank');
  else window.mostrarToast?.('Edge Function de PayPal aún no configurada.', 'error');
}

async function iniciarPagoManual(planId) {
  document.getElementById('modal-pago')?.remove();
  const userId = window.currentUser?.id;
  window.mostrarToast?.('Procesando pago de prueba…', 'info');
  const result = await paymentService.simularPagoManual(userId, planId);
  if (result.ok) {
    window.mostrarToast?.('✓ Pago simulado aprobado. ¡Plan activado!', 'success');
    setTimeout(() => { if (window.router) window.router.navigate('inicio'); else renderSuscripcion(); }, 1500);
  } else {
    window.mostrarToast?.('Error al procesar el pago: ' + result.error, 'error');
  }
}

function _estadoBadge(estado) {
  return { trial: '🟡 Prueba gratuita', activa: '🟢 Activa', vencida: '🔴 Vencida', pendiente: '🟠 Pendiente', cancelada: '⚫ Cancelada', fallida: '🔴 Fallida' }[estado] || estado;
}

function _formatFecha(fecha) {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}
