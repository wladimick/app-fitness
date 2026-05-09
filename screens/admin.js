// DeFatFit v3 — screens/admin.js

async function initAdmin() {
  const p = window.currentProfile;
  if (!p || p.rol !== 'admin') {
    goScreen('screen-inicio');
    return;
  }

  // Cargar usuarios desde Supabase
  const { data: usuarios, error } = await window.db
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Error al cargar usuarios');
    console.error(error);
    return;
  }

  // Stats resumen
  const activos = usuarios.filter(u => u.estado !== 'suspendido' && u.estado !== 'baja');
  document.getElementById('admin-total-usuarios').textContent  = usuarios.length;
  document.getElementById('admin-activos-hoy').textContent     = activos.length;
  document.getElementById('admin-adherencia').textContent      = '—';

  // Lista usuarios
  const cont = document.getElementById('admin-users');
  if (!cont) return;
  cont.innerHTML = '';

  usuarios.forEach(u => {
    const edad  = calcularEdad(u.fecha_nacimiento);
    const ini   = getIniciales(u.nombre || u.email || '?');
    const esSuspendido = u.estado === 'suspendido';
    const esBaja       = u.estado === 'baja';
    const estadoColor  = esSuspendido ? 'badge-orange' : esBaja ? 'badge-red' : 'badge-green';
    const estadoLabel  = esSuspendido ? 'Suspendido'  : esBaja ? 'De baja'   : 'Activo';

    const card = document.createElement('div');
    card.className = 'admin-user-card';
    card.innerHTML = `
      <div class="admin-user-top">
        <div class="admin-avatar">${ini}</div>
        <div style="flex:1">
          <div class="admin-user-name">${u.nombre || '(sin nombre)'}</div>
          <div class="admin-user-email">${u.email || u.id.slice(0,12) + '…'}</div>
        </div>
        <span class="badge ${estadoColor}">${estadoLabel}</span>
      </div>
      <div class="admin-user-stats">
        <div class="admin-stat">
          <div class="admin-stat-val">${capitalize(u.nivel || '—')}</div>
          <div class="admin-stat-lbl">Nivel</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat-val">${u.peso_actual ? u.peso_actual + ' kg' : '—'}</div>
          <div class="admin-stat-lbl">Peso</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat-val">${edad || '—'}</div>
          <div class="admin-stat-lbl">Edad</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat-val">${u.frecuencia_semanal || '—'}</div>
          <div class="admin-stat-lbl">Días/sem</div>
        </div>
      </div>
      ${u.objetivo ? `
        <div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--muted)">
          🎯 ${u.objetivo}
        </div>
      ` : ''}
      <div class="admin-actions">
        ${!esSuspendido && !esBaja ? `
          <button class="btn-danger" style="font-size:12px;padding:8px 14px" onclick="adminSuspender('${u.id}')">⏸ Suspender</button>
        ` : ''}
        ${esSuspendido ? `
          <button class="btn-secondary" style="font-size:12px;padding:8px 14px" onclick="adminReactivar('${u.id}')">▶ Reactivar</button>
        ` : ''}
        ${!esBaja ? `
          <button class="btn-danger" style="font-size:12px;padding:8px 14px;background:rgba(255,71,87,.05)" onclick="adminDarDeBaja('${u.id}')">🗑 Dar de baja</button>
        ` : ''}
        ${u.id !== window.currentUser?.id ? `
          <button class="btn-secondary" style="font-size:12px;padding:8px 14px;margin-left:auto" onclick="adminVerDetalle('${u.id}')">Ver detalle →</button>
        ` : '<span class="badge badge-purple" style="margin-left:auto;align-self:center">Tú</span>'}
      </div>
    `;
    cont.appendChild(card);
  });
}

async function adminSuspender(userId) {
  if (!confirm('¿Suspender a este usuario? No podrá iniciar sesión.')) return;
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

function adminVerDetalle(userId) {
  showToast('Vista de detalle — Sprint 3');
}

window.initAdmin        = initAdmin;
window.adminSuspender   = adminSuspender;
window.adminReactivar   = adminReactivar;
window.adminDarDeBaja   = adminDarDeBaja;
window.adminVerDetalle  = adminVerDetalle;
