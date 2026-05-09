// DeFatFit v3 — utils.js
// Helpers globales: fechas, formateo, toast, overlays

/* ── Toast ── */
let _toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Overlays ── */
function openOverlay(id)  { document.getElementById(id)?.classList.add('show');    }
function closeOverlay(id, e) {
  if (!e || e.target === document.getElementById(id))
    document.getElementById(id)?.classList.remove('show');
}

/* ── Fechas ── */
function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días 👋' : h < 19 ? 'Buenas tardes 👋' : 'Buenas noches 👋';
}

function formatFecha(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`;
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy  = new Date();
  const nac  = new Date(fechaNacimiento);
  let edad   = hoy.getFullYear() - nac.getFullYear();
  const m    = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function diaSemana() {
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return dias[new Date().getDay()];
}

/* ── Iniciales ── */
function getIniciales(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Capitalizar ── */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
