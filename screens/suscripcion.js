// screens/suscripcion.js
// DeFatFit v7 — Pantalla de suscripción y planes

async function renderSuscripcion() {
  const container = document.getElementById('screen-suscripcion');
  if (!container) return;

  const userId = window.currentUser?.id;
  if (!userId) return;

  container.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Cargando planes...</p></div>`;

  const [suscripcion, planes] = await Promise.all([
    subscriptionService.obtenerSuscripcionActual(userId),
    subscriptionService.obtenerPlanes()
  ]);

  const hoy = new Date().toISOString().split('T')[0];
  const tieneAcceso = suscripcion?.acceso_activo;
  const diasRestantes = subscriptionService.diasRestantes();

  container.innerHTML = `
    <div class="screen-header">
      <h1>Mi suscripción</h1>
    </div>

    ${suscripcion ? `
      <div class="card suscripcion-estado ${tieneAcceso ? 'activa' : 'vencida'}">
        <div class="suscripcion-badge">${_estadoBadge(suscripcion.estado)}</div>
        <div class="suscripcion-plan">${suscripcion.plan_nombre || suscripcion.plan_id}</div>
        ${tieneAcceso ? `
          <div class="suscripcion-dias">${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}</div>
          <div class="suscripcion-termino">Vence el ${_formatFecha(suscripcion.fecha_termino)}</div>
        ` : `
          <div class="suscripcion-vencida-msg">⚠️ Tu acceso ha vencido. Elige un plan para continuar.</div>
        `}
      </div>
    ` : `
      <div class="card suscripcion-no-plan">
        <div class="suscripcion-plan">Sin suscripción activa</div>
        <p>Activa tu prueba gratuita de 15 días para empezar.</p>
      </div>
    `}

    ${!suscripcion || !tieneAcceso ? `
      <div class="planes-grid">
        ${planes.map(plan => _renderPlanCard(plan, suscripcion)).join('')}
      </div>
    ` : `
      <div class="planes-section">
        <h2>Planes disponibles</h2>
        <p class="planes-nota">Tu plan actual está activo. Estos son los planes disponibles para cuando renueves.</p>
        <div class="planes-grid">
          ${planes.filter(p => !p.es_trial).map(plan => _renderPlanCard(plan, suscripcion)).join('')}
        </div>
      </div>
    `}

    <div class="pago-nota">
      <p>🔒 Pagos seguros. Los datos de tu tarjeta nunca se almacenan en nuestros servidores.</p>
    </div>
  `;
}

function _renderPlanCard(plan, suscripcionActual) {
  const esPlanActual = suscripcionActual?.plan_id === plan.id && suscripcionActual?.acceso_activo;
  const esTrial = plan.es_trial;

  return `
    <div class="plan-card ${esPlanActual ? 'plan-actual' : ''} ${esTrial ? 'plan-trial' : ''}">
      ${esTrial ? '<div class="plan-badge-trial">GRATIS</div>' : ''}
      ${esPlanActual ? '<div class="plan-badge-actual">Plan actual</div>' : ''}
      <div class="plan-nombre">${plan.nombre}</div>
      <div class="plan-descripcion">${plan.descripcion || ''}</div>
      <div class="plan-duracion">${plan.duracion_dias} días</div>
      ${plan.precio_clp != null ? `
        <div class="plan-precio">${plan.precio_clp === 0 ? 'Gratis' : '$' + plan.precio_clp.toLocaleString('es-CL') + ' CLP'}</div>
      ` : '<div class="plan-precio">Consultar precio</div>'}
      ${!esPlanActual ? `
        <button class="btn-primary btn-plan" onclick="seleccionarPlan('${plan.id}', ${plan.es_trial})">
          ${esTrial ? 'Activar prueba gratis' : 'Elegir plan'}
        </button>
      ` : `
        <div class="btn-plan-actual">✓ Plan activo</div>
      `}
    </div>
  `;
}

async function seleccionarPlan(planId, esTrial) {
  const userId = window.currentUser?.id;
  if (!userId) return;

  if (esTrial) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Activando...';

    const result = await subscriptionService.activarTrial(userId);

    if (result.ok) {
      window.mostrarToast?.('✓ ¡Prueba activada! Tienes 15 días de acceso completo.', 'success');
      setTimeout(() => {
        if (window.router) window.router.navigate('inicio');
        else renderSuscripcion();
      }, 1500);
    } else {
      btn.disabled = false;
      btn.textContent = 'Activar prueba gratis';
      window.mostrarToast?.('Error al activar la prueba. Intenta de nuevo.', 'error');
    }
    return;
  }

  // Para planes de pago: mostrar opciones de pago
  _mostrarOpcionesPago(planId);
}

function _mostrarOpcionesPago(planId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-pago';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Elige método de pago</h3>
        <button onclick="document.getElementById('modal-pago').remove()" class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <button class="btn-pago btn-mp" onclick="iniciarPagoMP('${planId}')">
          <span class="pago-icon">💳</span>
          <span>Mercado Pago</span>
        </button>
        <button class="btn-pago btn-paypal" onclick="iniciarPagoPayPal('${planId}')">
          <span class="pago-icon">🅿</span>
          <span>PayPal</span>
        </button>
        <div class="pago-divider">o</div>
        <button class="btn-pago btn-manual" onclick="iniciarPagoManual('${planId}')">
          <span class="pago-icon">🧪</span>
          <span>Simular pago (MVP test)</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function iniciarPagoMP(planId) {
  document.getElementById('modal-pago')?.remove();
  window.mostrarToast?.('Conectando con Mercado Pago...', 'info');

  const result = await paymentService.crearPreferenciaMercadoPago(planId);
  if (result.ok && result.initPoint) {
    window.open(result.initPoint, '_blank');
  } else {
    window.mostrarToast?.('Error al conectar con Mercado Pago. La Edge Function aún no está configurada.', 'error');
  }
}

async function iniciarPagoPayPal(planId) {
  document.getElementById('modal-pago')?.remove();
  window.mostrarToast?.('Conectando con PayPal...', 'info');

  const result = await paymentService.crearSuscripcionPayPal(planId);
  if (result.ok && result.approveUrl) {
    window.open(result.approveUrl, '_blank');
  } else {
    window.mostrarToast?.('Error al conectar con PayPal. La Edge Function aún no está configurada.', 'error');
  }
}

async function iniciarPagoManual(planId) {
  document.getElementById('modal-pago')?.remove();
  const userId = window.currentUser?.id;

  window.mostrarToast?.('Procesando pago de prueba...', 'info');
  const result = await paymentService.simularPagoManual(userId, planId);

  if (result.ok) {
    window.mostrarToast?.('✓ Pago simulado aprobado. ¡Plan activado!', 'success');
    setTimeout(() => {
      if (window.router) window.router.navigate('inicio');
      else renderSuscripcion();
    }, 1500);
  } else {
    window.mostrarToast?.('Error al procesar el pago: ' + result.error, 'error');
  }
}

function _estadoBadge(estado) {
  const badges = {
    trial: '🟡 Prueba gratuita',
    activa: '🟢 Activa',
    vencida: '🔴 Vencida',
    pendiente: '🟠 Pendiente',
    cancelada: '⚫ Cancelada',
    fallida: '🔴 Fallida'
  };
  return badges[estado] || estado;
}

function _formatFecha(fecha) {
  if (!fecha) return '-';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}
