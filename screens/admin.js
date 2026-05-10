// screens/admin.js
// DeFatFit — Panel de administración

async function initAdmin() {
  const p = window.currentProfile;
  if (!p || p.rol !== 'admin') { goScreen('screen-inicio'); return; }

  const container = document.getElementById('screen-admin');
  if (!container) return;

  container.innerHTML =
    UI.topbar({ title: 'Admin', subtitle: 'Panel de administración' }) +
    `<div class="screen-content">${UI.loading('Cargando usuarios…')}</div>`;

  const { data: usuarios, error } = await window.db
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Error al cargar usuarios');
    console.error(error);
    return;
  }

  const activos = usuarios.filter(u => u.estado !== 'suspendido' && u.estado !== 'baja');

  container.querySelector('.screen-content').innerHTML = `
    <div class="admin-header-card">
      <div class="admin-header-label">Panel de administración</div>
      <div class="admin-header-title">DeFatFit Admin</div>
    </div>

    <div class="admin-stats-grid">
      <div class="admin-stat">
        <div class="admin-stat-val" id="admin-total-usuarios">${usuarios.length}</div>
        <div class="admin-stat-lbl">Total</div>
      </div>
      <div class="admin-stat">
        <div class="admin-stat-val" id="admin-activos-hoy">${activos.length}</div>
        <div class="admin-stat-lbl">Activos</div>
      </div>
      <div class="admin-stat">
        <div class="admin-stat-val" id="admin-adherencia">—</div>
        <div class="admin-stat-lbl">Adherencia</div>
      </div>
    </div>

    <div class="sec-label">Usuarios registrados</div>
    <div id="admin-users">
      ${usuarios.map(u => _renderAdminUser(u)).join('')}
    </div>
    <div style="height:16px"></div>
  `;
}

function _renderAdminUser(u) {
  const edad  = calcularEdad?.(u.fecha_nacimiento) || '—';
  const ini   = getIniciales(u.nombre || u.email || '?');
  const esSuspendido = u.estado === 'suspendido';
  const esBaja       = u.estado === 'baja';
  const estadoColor  = esSuspendido ? 'badge-orange' : esBaja ? 'badge-red' : 'badge-green';
  const estadoLabel  = esSuspendido ? 'Suspendido'   : esBaja ? 'De baja'   : 'Activo';

  return `
    <div class="admin-user-row">
      <div class="admin-user-avatar">${ini}</div>
      <div class="admin-user-info">
        <div class="admin-user-nombre">${u.nombre || '(sin nombre)'}</div>
        <div class="admin-user-email">${u.email || u.id.slice(0,12) + '…'}</div>
        <div class="admin-user-badges">
          <span class="badge ${estadoColor}">${estadoLabel}</span>
          ${u.nivel ? `<span class="badge badge-gray">${capitalize?.(u.nivel) || u.nivel}</span>` : ''}
          ${u.frecuencia_semanal ? `<span class="badge badge-gray">${u.frecuencia_semanal}d/sem</span>` : ''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
        ${!esSuspendido && !esBaja ? `<button class="btn-secondary btn-sm" onclick="adminSuspender('${u.id}')">Suspender</button>` : ''}
        ${esSuspendido ? `<button class="btn-secondary btn-sm" onclick="adminReactivar('${u.id}')">Reactivar</button>` : ''}
        ${u.id !== window.currentUser?.id ? `<button class="btn-ghost btn-sm" onclick="adminVerDetalle('${u.id}')">Ver →</button>` : `<span class="badge badge-purple">Tú</span>`}
      </div>
    </div>`;
}

async function adminSuspender(userId) {
  if (!confirm('¿Suspender a este usuario?')) return;
  const { error } = await window.db.from('perfiles').update({ estado: 'suspendido' }).eq('id', userId);
  if (error) { showToast('Error al suspender'); return; }
  showToast('Usuario suspendido');
  initAdmin();
}

async function adminReactivar(userId) {
  const { error } = await window.db.from('perfiles').update({ estado: 'activo' }).eq('id', userId);
  if (error) { showToast('Error al reactivar'); return; }
  showToast('Usuario reactivado');
  initAdmin();
}

async function adminDarDeBaja(userId) {
  if (!confirm('¿Dar de baja a este usuario? Esta acción es definitiva.')) return;
  const { error } = await window.db.from('perfiles').update({ estado: 'baja' }).eq('id', userId);
  if (error) { showToast('Error al dar de baja'); return; }
  showToast('Usuario dado de baja');
  initAdmin();
}

function adminVerDetalle(userId) { showToast('Vista de detalle — Sprint 3'); }

window.initAdmin       = initAdmin;
window.adminSuspender  = adminSuspender;
window.adminReactivar  = adminReactivar;
window.adminDarDeBaja  = adminDarDeBaja;
window.adminVerDetalle = adminVerDetalle;
