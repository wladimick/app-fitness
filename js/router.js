// DeFatFit v3 — router.js
// Navegación entre screens, sidebar, estado

/* ── Navegación ── */
function goScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  // Nav inferior: highlight. Alimentación vive dentro de Inicio, no como pestaña propia.
  const navScreen = id === 'screen-alimentacion' ? 'screen-inicio' : id;
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.screen === navScreen)
  );

  window.scrollTo(0, 0);
  closeSidebar();

  // Inicializar la screen al entrar
  const inits = {
    'screen-inicio':    () => window.initDashboard?.(),
    'screen-rutina':    () => window.initRutina?.(),
    'screen-alimentacion': () => window.initAlimentacion?.(),
    'screen-calendario':() => window.initCalendario?.(),
    'screen-perfil':    () => window.initPerfil?.(),
    'screen-usuario':   () => window.initUsuario?.(),
    'screen-admin':     () => window.initAdmin?.(),
    'screen-recomendar':() => {},
  };
  inits[id]?.();
}

/* ── Sidebar ── */
function openSidebar() {
  if (document.body.classList.contains('auth-mode')) return;
  if (document.getElementById('app-shell')?.style.display === 'none') return;
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar?.classList.add('open');
  overlay?.classList.add('open');
  sidebar?.setAttribute('aria-hidden', 'false');
  overlay?.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('.menu-btn').forEach(btn => btn.setAttribute('aria-expanded','true')); 
  // Actualizar datos del sidebar con el perfil actual
  const p = window.currentProfile;
  if (p) {
    const el = document.getElementById('sidebar-name');
    const em = document.getElementById('sidebar-email');
    const av = document.getElementById('sidebar-avatar-text');
    if (el) el.textContent = p.nombre || 'Usuario';
    if (em) em.textContent = window.currentUser?.email || '';
    if (av) av.textContent = getIniciales(p.nombre);
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('open');
  sidebar?.setAttribute('aria-hidden', 'true');
  overlay?.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.menu-btn').forEach(btn => btn.setAttribute('aria-expanded','false'));
}

// Cerrar sidebar al tocar el overlay
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
});
