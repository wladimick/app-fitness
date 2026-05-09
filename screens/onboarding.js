// DeFatFit v3 — screens/onboarding.js
// Flujo de bienvenida para usuarios nuevos

let onboardingStep = 1;
const TOTAL_STEPS  = 5;
const obData = {};

function mostrarOnboarding() {
  document.getElementById('screen-onboarding').classList.add('visible');
  onboardingStep = 1;
  // Pre-rellenar nombre desde perfil
  const p = window.currentProfile;
  if (p?.nombre) {
    document.getElementById('ob-nombre').value = p.nombre;
  }
  irStepOnboarding(1);
}

function irStepOnboarding(n) {
  onboardingStep = n;
  document.querySelectorAll('.onboarding-step').forEach((s, i) =>
    s.classList.toggle('active', i + 1 === n)
  );
  // Barra de progreso
  document.getElementById('ob-progress-bar').style.width =
    ((n - 1) / TOTAL_STEPS * 100) + '%';
  // Botón anterior
  const btnAntes = document.getElementById('ob-btn-antes');
  if (btnAntes) btnAntes.style.visibility = n === 1 ? 'hidden' : 'visible';
}

function obSiguiente() {
  // Validaciones por step
  if (onboardingStep === 1) {
    const nombre = document.getElementById('ob-nombre').value.trim();
    if (!nombre) { showToast('Escribe tu nombre'); return; }
    obData.nombre = nombre;

    const fechaNac = document.getElementById('ob-fecha-nac').value;
    if (fechaNac) obData.fecha_nacimiento = fechaNac;

    const peso = parseFloat(document.getElementById('ob-peso').value);
    if (peso) obData.peso_actual = peso;
  }

  if (onboardingStep === 2) {
    const sel = document.querySelector('#ob-step-2 .onboarding-option.selected');
    if (!sel) { showToast('Selecciona tu nivel'); return; }
    obData.nivel = sel.dataset.val;
  }

  if (onboardingStep === 3) {
    const sel = document.querySelector('#ob-step-3 .onboarding-option.selected');
    if (!sel) { showToast('Selecciona un objetivo'); return; }
    obData.objetivo = sel.dataset.val;
  }

  if (onboardingStep === 4) {
    const sel = document.querySelector('#ob-step-4 .onboarding-option.selected');
    if (!sel) { showToast('Elige tu frecuencia'); return; }
    obData.frecuencia_semanal = parseInt(sel.dataset.val);
  }

  if (onboardingStep === TOTAL_STEPS) {
    completarOnboarding();
    return;
  }

  irStepOnboarding(onboardingStep + 1);
}

function obAnterior() {
  if (onboardingStep > 1) irStepOnboarding(onboardingStep - 1);
}

function obSeleccionarOpcion(el, stepId) {
  document.querySelectorAll(`#${stepId} .onboarding-option`)
    .forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

async function completarOnboarding() {
  const user = window.currentUser;
  if (!user) return;

  const update = {
    id: user.id,
    nombre: obData.nombre || window.currentProfile?.nombre || user.user_metadata?.nombre || user.email.split('@')[0],
    rol: window.currentProfile?.rol || 'usuario',
    nivel: obData.nivel || window.currentProfile?.nivel || 'principiante',
    objetivo: obData.objetivo || window.currentProfile?.objetivo || null,
    peso_actual: obData.peso_actual ?? window.currentProfile?.peso_actual ?? null,
    fecha_nacimiento: obData.fecha_nacimiento ?? window.currentProfile?.fecha_nacimiento ?? null,
    frecuencia_semanal: obData.frecuencia_semanal ?? window.currentProfile?.frecuencia_semanal ?? 4,
    onboarding_completo: true,
  };

  try {
    const { data, error } = await window.db
      .from('perfiles')
      .upsert(update, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    window.currentProfile = data;
  } catch (e) {
    console.error('No se pudo guardar onboarding en Supabase:', e);
    showToast('No se pudo guardar el tutorial. Revisa Supabase/RLS.');
    return;
  }

  // Ir a la app
  document.body.classList.remove('auth-mode');
  document.body.classList.add('app-mode');
  document.getElementById('screen-onboarding').classList.remove('visible');
  document.getElementById('app-shell').style.display  = 'block';
  document.getElementById('bottom-nav').style.display = 'flex';

  window.initDashboard?.();
  window.initRutina?.();
  window.initPerfil?.();
  window.initUsuario?.();
  goScreen('screen-inicio');
  showToast('¡Bienvenido a DeFatFit! 💪');
}
