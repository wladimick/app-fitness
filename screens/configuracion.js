// screens/configuracion.js
// DeFatFit — Configuración de la aplicación (stub Sprint 2)

function initConfiguracion() {
  const container = document.getElementById('screen-configuracion');
  if (!container) return;

  container.innerHTML =
    UI.topbar({ title: 'Configuración' }) +
    `<div class="screen-content">
      ${_renderSeccion('Entrenamiento', [
        { icon: '⏱', label: 'Descanso por defecto', sub: '90 segundos', right: '›', onclick: `showToast('Sprint 2')` },
        { icon: '🔔', label: 'Recordatorio de entrenamiento', sub: 'Notificación diaria', right: _toggle('notif-entrenamiento'), onclick: '' },
        { icon: '🎯', label: 'Días de entrenamiento', sub: 'Lun · Mar · Jue · Vie', right: '›', onclick: `showToast('Sprint 2')` },
      ])}

      ${_renderSeccion('Alimentación', [
        { icon: '💧', label: 'Meta de agua diaria', sub: '11 vasos (2.75 L)', right: '›', onclick: `showToast('Sprint 2')` },
        { icon: '🥗', label: 'Notificación de porciones', sub: 'Recordatorio a mediodía', right: _toggle('notif-comida'), onclick: '' },
      ])}

      ${_renderSeccion('Aplicación', [
        { icon: '🌙', label: 'Tema oscuro', sub: 'Siempre activado', right: _toggle('tema-oscuro', true, true), onclick: '' },
        { icon: '🔒', label: 'Privacidad y datos', sub: 'Política de privacidad', right: '›', onclick: `showToast('Sprint 2')` },
        { icon: '📲', label: 'Instalar app (PWA)', sub: 'Agregar a pantalla de inicio', right: '›', onclick: `window.installPWA?.()` },
        { icon: '🔄', label: 'Versión de la app', sub: 'DeFatFit v7 · Sprint 1', right: '', onclick: '' },
      ])}

      ${_renderSeccion('Cuenta', [
        { icon: '✉️', label: 'Email', sub: window.currentUser?.email || '—', right: '', onclick: '' },
        { icon: '🔑', label: 'Cambiar contraseña', sub: '', right: '›', onclick: `iniciarCambioPassword()` },
        { icon: '🗑', label: 'Eliminar cuenta', sub: 'Acción irreversible', right: '›', onclick: `confirmarEliminarCuenta()`, danger: true },
      ])}

      <div style="height:16px"></div>
    </div>`;
}

function _renderSeccion(titulo, items) {
  return `
    <div class="sec-label">${titulo}</div>
    <div class="card" style="padding:0 16px">
      ${items.map(item => `
        <div class="config-item ${item.danger ? 'config-item--danger' : ''}" ${item.onclick ? `onclick="${item.onclick}"` : ''}>
          <div class="config-item-left">
            <div class="config-item-icon">${item.icon}</div>
            <div>
              <div class="config-item-label" style="${item.danger ? 'color:var(--red)' : ''}">${item.label}</div>
              ${item.sub ? `<div class="config-item-sub">${item.sub}</div>` : ''}
            </div>
          </div>
          <div class="config-item-right">${item.right}</div>
        </div>`).join('')}
    </div>`;
}

function _toggle(id, checked = false, disabled = false) {
  return `
    <label class="toggle-switch" onclick="event.stopPropagation()">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="onToggleConfig('${id}', this.checked)">
      <span class="toggle-slider"></span>
    </label>`;
}

function onToggleConfig(key, val) {
  window.mostrarToast?.(`Configuración guardada`, 'success');
}

function iniciarCambioPassword() {
  window.mostrarToast?.('Cambio de contraseña — Sprint 2', 'info');
}

function confirmarEliminarCuenta() {
  if (!confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no puede deshacerse.')) return;
  window.mostrarToast?.('Eliminación de cuenta — contacta al soporte', 'error');
}

window.initConfiguracion    = initConfiguracion;
window.onToggleConfig       = onToggleConfig;
window.iniciarCambioPassword = iniciarCambioPassword;
window.confirmarEliminarCuenta = confirmarEliminarCuenta;
