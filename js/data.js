// js/data.js
// Archivo neutro.
// Supabase es la única fuente de verdad para datos reales.
// No agregar ejercicios, rutinas, mediciones, suplementos ni datos demo aquí.

window.appData = {
  version: 'supabase-only',
};

// Compatibilidad mínima para módulos legacy que aún invocan helpers locales.
function cargarPerfilLocal() { return null; }
function savePerfilLocal() {}
function defaultRutina() { return null; }
function cargarRutinaLocal() { return null; }
function saveRutinaLocal() {}
