// DeFatFit v3 — auth.js
// Login, registro, logout, sesión, carga de perfil

/* ── Mensajes ── */
function mostrarAuthMensaje(texto, tipo = '') {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent  = texto;
  el.className    = `auth-message ${tipo}`.trim();
  el.style.display = texto ? 'block' : 'none';
}

/* ── Toggle login / registro ── */
function toggleAuthMode(modo) {
  const loginForm    = document.getElementById('form-login');
  const registroForm = document.getElementById('form-registro');
  const title        = document.getElementById('auth-title');
  const subtitle     = document.getElementById('auth-subtitle');
  mostrarAuthMensaje('');

  if (modo === 'registro') {
    loginForm.style.display    = 'none';
    registroForm.style.display = 'flex';
    title.textContent    = 'Crear cuenta';
    subtitle.textContent = 'Registra tu usuario para guardar tus rutinas y métricas.';
  } else {
    registroForm.style.display = 'none';
    loginForm.style.display    = 'flex';
    title.textContent    = 'Iniciar sesión';
    subtitle.textContent = 'Accede a tu planificación, rutina del día y métricas Body Pro.';
  }
}

/* ── Mostrar / ocultar pantallas ── */
function mostrarLogin() {
  closeSidebar?.();
  document.body.classList.add('auth-mode');
  document.body.classList.remove('app-mode');
  document.getElementById('screen-login').classList.add('visible');
  document.getElementById('app-shell').style.display    = 'none';
  document.getElementById('bottom-nav').style.display   = 'none';
  document.getElementById('screen-onboarding').classList.remove('visible');
}

function ocultarLogin() {
  document.getElementById('screen-login').classList.remove('visible');
}

/* ── Cargar perfil desde Supabase ── */
async function cargarPerfil(userId) {
  const { data, error } = await window.db
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/* ── Entrar a la app ── */
async function entrarApp(user) {
  window.currentUser = user;

  // Intentar cargar perfil de Supabase
  let perfil = await cargarPerfil(user.id);

  if (!perfil) {
    // Crear perfil vacío si no existe (usuario nuevo sin onboarding)
    const { data, error } = await window.db.from('perfiles').upsert({
      id:     user.id,
      nombre: user.user_metadata?.nombre || user.email.split('@')[0],
      rol:    'usuario',
      nivel:  'principiante',
      onboarding_completo: false,
    }, { onConflict: 'id' }).select().single();

    if (error) {
      console.error('No se pudo crear perfil en Supabase:', error);
      mostrarAuthMensaje('Tu cuenta existe, pero no se pudo crear el perfil. Revisa las policies RLS de Supabase.', 'error');
      return;
    }
    perfil = data;
  }

  window.currentProfile = perfil;
  const suscripcion = await subscriptionService.obtenerSuscripcionActual(user.id);
  window.currentSubscriptionLabel = suscripcion?.plan_nombre || 'Sin plan activo';

  // Si no completó el onboarding → mostrarlo
  if (!perfil?.onboarding_completo) {
    ocultarLogin();
    document.getElementById('app-shell').style.display  = 'none';
    document.getElementById('bottom-nav').style.display = 'none';
    mostrarOnboarding();
    return;
  }

  // Entrar directo a la app
  document.body.classList.remove('auth-mode');
  document.body.classList.add('app-mode');
  ocultarLogin();
  document.getElementById('app-shell').style.display  = 'block';
  document.getElementById('bottom-nav').style.display = 'flex';

  // Si es admin → mostrar ícono admin en sidebar
  if (perfil.rol === 'admin') {
    document.getElementById('sidebar-admin-section')?.style.removeProperty('display');
  }

  window.initDashboard?.();
  window._rutinaHoy = null;
  window.initRutina?.();
  window.initPerfil?.();
  window.initUsuario?.();
  goScreen('screen-inicio');
}

/* ── Registro ── */
async function handleRegistro(event) {
  event.preventDefault();
  const nombre   = document.getElementById('registro-nombre').value.trim();
  const email    = document.getElementById('registro-email').value.trim();
  const password = document.getElementById('registro-password').value;

  if (!nombre) { mostrarAuthMensaje('Escribe tu nombre', 'error'); return; }

  mostrarAuthMensaje('Creando cuenta...', 'info');

  try {
    const { data, error } = await window.db.auth.signUp({
      email, password,
      options: { data: { nombre } }
    });
    if (error) throw error;

    if (data.user && !data.session) {
      mostrarAuthMensaje('Revisa tu correo para confirmar tu cuenta.', 'success');
      return;
    }
    if (data.user) {
      mostrarAuthMensaje('');
      await entrarApp(data.user);
    }
  } catch (err) {
    mostrarAuthMensaje(err.message || 'No se pudo crear la cuenta.', 'error');
  }
}

/* ── Login ── */
async function handleLogin(event) {
  event.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  mostrarAuthMensaje('Entrando...', 'info');

  try {
    const { data, error } = await window.db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    mostrarAuthMensaje('');
    await entrarApp(data.user);
  } catch (err) {
    mostrarAuthMensaje(err.message || 'Email o contraseña incorrectos.', 'error');
  }
}

/* ── Logout ── */
async function logout() {
  await window.db.auth.signOut();
  window.currentUser    = null;
  window.currentProfile = null;
  mostrarLogin();
  showToast('Sesión cerrada');
}

/* ── Inicializar auth ── */
async function initAuth() {
  try {
    const { data: { session } } = await window.db.auth.getSession();
    if (session?.user) {
      await entrarApp(session.user);
    } else {
      mostrarLogin();
    }

    window.db.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') {
        mostrarLogin();
      }
    });
  } catch (err) {
    console.error('Error auth:', err);
    mostrarLogin();
  }
}
