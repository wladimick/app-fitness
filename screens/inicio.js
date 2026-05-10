// DeFatFit v3 — screens/inicio.js

async function initDashboard() {
  const p = window.currentProfile || {};
  const r = window._rutinaHoy || null;

  const el = document.getElementById('dash-saludo');
  const nm = document.getElementById('dash-nombre');
  if (el) el.textContent = saludo();
  if (nm) nm.textContent = (p.nombre || 'Usuario').split(' ')[0].toUpperCase();
  const planEl = document.getElementById('dash-plan-actual');
  if (planEl) planEl.textContent = window.currentSubscriptionLabel || 'Sin plan activo';

  const tag = document.getElementById('dash-rutina-tag');
  if (tag) tag.textContent = `📅 HOY · ${diaSemana().toUpperCase()}`;

  const rNombre = document.getElementById('dash-rutina-nombre');
  if (rNombre) rNombre.textContent = r?.nombre || 'No tienes rutina asignada para hoy';

  const dur = document.getElementById('dash-duracion');
  if (dur) dur.textContent = r?.duracionMinutos ? `${r.duracionMinutos} min` : '—';

  const grp = document.getElementById('dash-grupo');
  if (grp) grp.textContent = r?.grupoPrincipal || 'Pendiente';

  const niv = document.getElementById('dash-nivel-badge');
  if (niv) niv.textContent = r?.nivel || 'Sin rutina';

  const racha = document.getElementById('dash-racha');
  if (racha) racha.textContent = p.racha || 0;

  const peso = document.getElementById('dash-peso');
  if (peso) peso.textContent = p.peso_actual || p.peso || '—';

  renderTipDelDia('tip-del-dia');
  window.updateAlimentacionDashboard?.();
  await renderMensajesInicio();
  updateDashProgress();
  const quick = document.getElementById('dash-empty-actions');
  if (!r || !p.objetivo) {
    let el = quick;
    if (!el) { el = document.createElement('div'); el.id = 'dash-empty-actions'; document.getElementById('screen-inicio')?.appendChild(el); }
    el.innerHTML = `<div class="card" style="margin-top:10px"><div>Aún estás comenzando.</div><div style="display:flex;gap:8px;margin-top:8px"><button class="btn-secondary" onclick="goScreen('screen-usuario')">Completar perfil</button><button class="btn-primary" onclick="goScreen('screen-planificador')">Crear mis rutinas</button></div></div>`;
  }

}

async function renderMensajesInicio() {
  const hostId = 'dash-mensajes-inicio';
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    const screen = document.getElementById('screen-inicio');
    screen?.appendChild(host);
  }
  if (!window.contentService) return;
  const msgs = await contentService.obtenerMensajesInicio();
  if (!msgs.length) { host.innerHTML = ''; return; }
  host.innerHTML = `<div class="sec-label">Mensajes</div>${msgs.slice(0,3).map(m=>`
    <div class="card" style="margin:8px 0">
      <div style="font-size:12px;color:var(--accent);text-transform:uppercase">${m.tipo || 'novedad'}</div>
      <div style="font-weight:600;margin-top:4px">${m.titulo}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:6px">${m.contenido || ''}</div>
      ${m.link_url ? `<a class="btn-secondary" style="margin-top:10px" href="${m.link_url}" target="_blank">${m.boton_texto || 'Ver más'}</a>` : ''}
    </div>`).join('')}`;
}

function updateDashProgress() {
  const r = window._rutinaHoy || null;
  if (!r) {
    const bar = document.getElementById('dash-prog');
    const lbl = document.getElementById('dash-prog-label');
    if (bar) bar.style.width = '0%';
    if (lbl) lbl.textContent = '0 / 0 ejercicios';
    return;
  }
  const total = r.ejercicios.length;
  const done  = r.ejercicios.filter(e => e.completado).length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  const bar = document.getElementById('dash-prog');
  const lbl = document.getElementById('dash-prog-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = `${done} / ${total} ejercicios`;
}

window.initDashboard = initDashboard;
window.updateDashProgress = updateDashProgress;
