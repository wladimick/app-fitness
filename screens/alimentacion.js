// screens/alimentacion.js
// DeFatFit v7 — Pantalla de alimentación (reemplaza localStorage por Supabase)

let _alimentacionGrupos = [];
let _alimentacionRegistro = null;

async function renderAlimentacion() {
  const container = document.getElementById('screen-alimentacion');
  if (!container) return;

  const userId = window.currentUser?.id;
  const hoy = new Date().toISOString().split('T')[0];

  container.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Cargando...</p></div>`;

  const [grupos, registro] = await Promise.all([
    nutritionService.obtenerGrupos(),
    nutritionService.obtenerRegistroDelDia(userId, hoy)
  ]);

  _alimentacionGrupos = grupos;
  _alimentacionRegistro = registro;

  const porciones = registro?.alimentacion_porciones || [];
  const aguaVasos = registro?.agua_vasos || 0;
  const completo = registro?.completo || false;

  // Calcular progreso global
  const totalGrupos = grupos.length;
  const gruposCompletos = grupos.filter(g => {
    const p = porciones.find(p => p.grupo_id === g.id);
    return p && p.cantidad >= g.meta;
  }).length;

  container.innerHTML = `
    <div class="screen-header">
      <h1>Alimentación</h1>
      <div class="alim-fecha">${_formatFechaHoy()}</div>
    </div>

    ${completo ? `
      <div class="alim-completado-banner">
        🎉 ¡Plan nutricional completado hoy!
      </div>
    ` : ''}

    <div class="alim-progreso-global">
      <div class="alim-progreso-texto">${gruposCompletos}/${totalGrupos} grupos completos</div>
      <div class="alim-progreso-barra">
        <div class="alim-progreso-relleno" style="width: ${(gruposCompletos / totalGrupos * 100).toFixed(0)}%"></div>
      </div>
    </div>

    <div class="alim-grupos">
      ${grupos.map(grupo => {
        const porcion = porciones.find(p => p.grupo_id === grupo.id);
        const cantidad = porcion?.cantidad || 0;
        return _renderGrupo(grupo, cantidad);
      }).join('')}
    </div>

    <div class="alim-agua-seccion">
      <div class="alim-agua-header">
        <span class="alim-agua-titulo">💧 Agua</span>
        <span class="alim-agua-meta">${aguaVasos}/${nutritionService.META_VASOS} vasos</span>
      </div>
      <div class="alim-agua-vasos">
        ${Array.from({ length: nutritionService.META_VASOS }, (_, i) => `
          <button class="alim-vaso ${i < aguaVasos ? 'lleno' : ''}"
            onclick="toggleVasoAgua(${i + 1})">
            💧
          </button>
        `).join('')}
      </div>
    </div>

    <div class="alim-nota">
      <p>Sin pauta personalizada registrada</p>
    </div>
  `;
}

function _renderGrupo(grupo, cantidad) {
  const meta = grupo.meta;
  const porcentaje = Math.min(100, (cantidad / meta * 100)).toFixed(0);
  const completo = cantidad >= meta;

  return `
    <div class="alim-grupo-card ${completo ? 'completo' : ''}">
      <div class="alim-grupo-header">
        <div class="alim-grupo-label">${grupo.label}</div>
        <div class="alim-grupo-cantidad">
          <span class="alim-cantidad-actual">${cantidad % 1 === 0 ? cantidad : cantidad.toFixed(1)}</span>
          <span class="alim-cantidad-meta">/ ${meta} ${grupo.unidad}</span>
        </div>
      </div>
      <div class="alim-grupo-barra">
        <div class="alim-grupo-relleno ${completo ? 'completo' : ''}" style="width: ${porcentaje}%"></div>
      </div>
      <div class="alim-grupo-controles">
        <button class="alim-btn-ctrl" onclick="ajustarPorcion('${grupo.id}', ${cantidad}, -0.5, ${meta})">−</button>
        <button class="alim-btn-ctrl alim-btn-media" onclick="ajustarPorcion('${grupo.id}', ${cantidad}, 0.5, ${meta})">+½</button>
        <button class="alim-btn-ctrl" onclick="ajustarPorcion('${grupo.id}', ${cantidad}, 1, ${meta})">+1</button>
      </div>
    </div>
  `;
}

async function ajustarPorcion(grupoId, cantidadActual, delta, meta) {
  const userId = window.currentUser?.id;
  const hoy = new Date().toISOString().split('T')[0];

  const nueva = Math.max(0, parseFloat((cantidadActual + delta).toFixed(1)));

  // Actualizar optimistamente la UI
  _actualizarUIGrupo(grupoId, nueva, meta);

  const result = await nutritionService.actualizarPorcion(userId, hoy, grupoId, nueva, meta);
  if (!result.ok) {
    window.mostrarToast?.('Error al guardar', 'error');
    // Revertir
    _actualizarUIGrupo(grupoId, cantidadActual, meta);
  }
}

function _actualizarUIGrupo(grupoId, cantidad, meta) {
  // Actualización ligera sin re-render completo
  const cards = document.querySelectorAll('.alim-grupo-card');
  // Buscar la card del grupo y actualizar sus valores
  // Para MVP: re-render completo
  renderAlimentacion();
}

async function toggleVasoAgua(vasoNum) {
  const userId = window.currentUser?.id;
  const hoy = new Date().toISOString().split('T')[0];

  const aguaActual = _alimentacionRegistro?.agua_vasos || 0;
  // Si clickeas en el mismo vaso que es el último lleno → restar
  const nuevoTotal = vasoNum === aguaActual ? vasoNum - 1 : vasoNum;

  const result = await nutritionService.actualizarAgua(userId, hoy, Math.max(0, nuevoTotal));
  if (result.ok) {
    renderAlimentacion();
  }
}

function _formatFechaHoy() {
  const hoy = new Date();
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${dias[hoy.getDay()]} ${hoy.getDate()} ${meses[hoy.getMonth()]}`;
}

function _fechaPauta() {
  return 'jul 2024';
}
