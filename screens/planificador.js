// screens/planificador.js
// DeFatFit v7 — Planificador semanal
// Permite planificar cualquier semana, asignar rutinas por día,
// reutilizar rutinas de otros días y marcar descansos.

// ─────────────────────────────────────────────
// ESTADO DEL MÓDULO
// ─────────────────────────────────────────────

const planificador = (() => {
  let _semanaOffset = 0;          // 0 = semana actual, 1 = próxima, -1 = anterior
  let _planSemana   = [];         // array de 7 días con su estado y rutina
  let _rutinas      = [];         // catálogo de rutinas disponibles
  let _rutinasFavoritas = [];
  let _diaSeleccionado = null;    // fecha del día en edición
  let _userId = null;

  // ─────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────

  async function render() {
    const container = document.getElementById('screen-planificador');
    if (!container) return;

    _userId = window.currentUser?.id;
    container.innerHTML = `<div class="loading-state"><div class="loader"></div></div>`;

    await _cargarDatos();
    _renderVista(container);
  }

  // ─────────────────────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────────────────────

  async function _cargarDatos() {
    const dias = _getDiasSemana();
    const inicio = dias[0];
    const fin    = dias[6];

    // Cargar rutinas disponibles (templates + propias)
    const [templates, propias] = await Promise.all([
      exerciseService.obtenerRutinasTemplate(),
      exerciseService.obtenerRutinasUsuario(_userId)
    ]);
    _rutinas = [...templates, ...propias];
    _rutinasFavoritas = (propias || []).filter(r => r.es_favorita);

    // Cargar planificación de la semana actual
    const { data, error } = await window.db
      .from('calendario')
      .select('*, rutinas(id, nombre, grupo_principal, duracion_minutos, nivel)')
      .eq('usuario_id', _userId)
      .gte('fecha', inicio)
      .lte('fecha', fin);

    if (error) {
      console.error('[planificador] Error cargando semana:', error.message);
      _planSemana = dias.map(f => ({ fecha: f, estado: null, rutina_id: null, rutinas: null, id: null }));
      return;
    }

    // Construir array completo de 7 días
    _planSemana = dias.map(fecha => {
      const db = (data || []).find(d => d.fecha === fecha);
      return db || { fecha, estado: null, rutina_id: null, rutinas: null, id: null };
    });
  }

  // ─────────────────────────────────────────────
  // RENDER DE LA VISTA
  // ─────────────────────────────────────────────

  function _renderVista(container) {
    const hoy      = _hoy();
    const dias     = _getDiasSemana();
    const etiqueta = _etiquetaSemana();
    const esSemanaActual = _semanaOffset === 0;
    const esSemanaFutura = _semanaOffset > 0;

    container.innerHTML = `
      <div class="plan-screen">

        <!-- HEADER -->
        <div class="plan-header">
          <div>
            <h1>Planificar</h1>
            <div class="plan-subtitulo">${etiqueta}</div>
          </div>
          <button class="icon-btn menu-btn" onclick="openSidebar()" aria-label="Abrir menú"><svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
          <div class="plan-semana-nav">
            <button class="plan-nav-btn" onclick="planificador.navegarSemana(-1)">‹</button>
            <div class="plan-semana-label">
              <span class="plan-semana-texto">${etiqueta}</span>
              ${esSemanaActual ? '<span class="plan-semana-badge">Esta semana</span>' : ''}
              ${_semanaOffset === 1 ? '<span class="plan-semana-badge next">Próxima semana</span>' : ''}
            </div>
            <button class="plan-nav-btn" onclick="planificador.navegarSemana(1)">›</button>
          </div>
        </div>

        <!-- ACCESOS RÁPIDOS -->
        <div class="plan-acciones-rapidas">
          <button class="plan-accion-btn" onclick="planificador.copiarSemanaAnterior()">
            <span>↩</span> Copiar semana anterior
          </button>
          <button class="plan-accion-btn" onclick="planificador.limpiarSemana()">
            <span>✕</span> Limpiar semana
          </button>
        </div>

        <!-- RESUMEN SEMANA -->
        <div class="plan-resumen">
          ${_renderResumenStrip()}
        </div>

        <!-- DÍAS DE LA SEMANA -->
        <div class="plan-dias">
          ${_planSemana.map((dia, i) => _renderDiaCard(dia, i, hoy)).join('')}
        </div>

        <!-- PANEL SELECTOR DE RUTINA (oculto por defecto) -->
        <div id="plan-selector-panel" class="plan-selector-panel" style="display:none">
          ${_renderSelectorRutina()}
        </div>

      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // CARD DE CADA DÍA
  // ─────────────────────────────────────────────

  function _renderDiaCard(dia, index, hoy) {
    const nombreDia   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][index];
    const nombreDiaFull = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][index];
    const [y, m, d]   = dia.fecha.split('-');
    const numDia      = parseInt(d);
    const esHoy       = dia.fecha === hoy;
    const esPasado    = dia.fecha < hoy;
    const tieneRutina = !!dia.rutina_id || !!dia.rutinas;
    const esDescanso  = dia.estado === 'descanso';
    const completado  = dia.estado === 'completado';
    const perdido     = dia.estado === 'perdido' && esPasado;

    const rutinaNombre    = dia.rutinas?.nombre || _rutinas.find(r => r.id === dia.rutina_id)?.nombre || '';
    const rutinaGrupo     = dia.rutinas?.grupo_principal || '';
    const rutinaDuracion  = dia.rutinas?.duracion_minutos || '';

    let claseCard = 'plan-dia-card';
    if (esHoy)      claseCard += ' es-hoy';
    if (esPasado)   claseCard += ' es-pasado';
    if (completado) claseCard += ' completado';
    if (esDescanso) claseCard += ' descanso';
    if (perdido)    claseCard += ' perdido';

    return `
      <div class="${claseCard}" data-fecha="${dia.fecha}">
        <!-- Cabecera del día -->
        <div class="plan-dia-header">
          <div class="plan-dia-info">
            <span class="plan-dia-nombre">${nombreDia}</span>
            <span class="plan-dia-num">${numDia}</span>
            ${esHoy ? '<span class="plan-hoy-badge">HOY</span>' : ''}
          </div>
          <div class="plan-dia-acciones">
            ${!esPasado ? `
              <button class="plan-btn-icono" title="Asignar rutina"
                onclick="planificador.abrirSelector('${dia.fecha}')">＋</button>
              ${tieneRutina || esDescanso ? `
                <button class="plan-btn-icono plan-btn-clear" title="Quitar"
                  onclick="planificador.quitarDia('${dia.fecha}')">✕</button>
              ` : ''}
            ` : ''}
          </div>
        </div>

        <!-- Contenido del día -->
        <div class="plan-dia-contenido" onclick="${!esPasado ? `planificador.abrirSelector('${dia.fecha}')` : ''}">
          ${esDescanso ? `
            <div class="plan-dia-descanso">
              <span class="plan-descanso-icon">😴</span>
              <span>Descanso</span>
            </div>
          ` : tieneRutina ? `
            <div class="plan-dia-rutina">
              <div class="plan-rutina-nombre">${rutinaNombre}</div>
              ${rutinaGrupo ? `<div class="plan-rutina-grupo">${_iconGrupo(rutinaGrupo)} ${rutinaGrupo}</div>` : ''}
              ${rutinaDuracion ? `<div class="plan-rutina-dur">⏱ ${rutinaDuracion} min</div>` : ''}
            </div>
          ` : `
            <div class="plan-dia-vacio">
              ${!esPasado ? `<span class="plan-vacio-plus">＋</span><span>Agregar rutina</span>` : '<span class="plan-sin-registro">—</span>'}
            </div>
          `}
        </div>

        <!-- Footer con estado y acciones de día pasado -->
        ${completado || perdido ? `
          <div class="plan-dia-footer">
            <span class="plan-estado-chip ${dia.estado}">${_estadoLabel(dia.estado)}</span>
          </div>
        ` : tieneRutina && !esPasado && !esDescanso ? `
          <div class="plan-dia-footer">
            <button class="plan-btn-usar btn-sm"
              onclick="event.stopPropagation(); planificador.usarHoy('${dia.fecha}', '${dia.rutina_id || ''}')">
              Usar como hoy
            </button>
            <button class="plan-btn-copiar btn-sm"
              onclick="event.stopPropagation(); planificador.abrirCopiarA('${dia.fecha}', '${dia.rutina_id || ''}')">
              Copiar a…
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // STRIP DE RESUMEN SEMANAL
  // ─────────────────────────────────────────────

  function _renderResumenStrip() {
    const entrenos   = _planSemana.filter(d => d.rutina_id && d.estado !== 'descanso').length;
    const descansos  = _planSemana.filter(d => d.estado === 'descanso').length;
    const vacios     = _planSemana.filter(d => !d.rutina_id && d.estado !== 'descanso').length;
    const completados = _planSemana.filter(d => d.estado === 'completado').length;

    return `
      <div class="plan-resumen-chips">
        <div class="plan-chip entreno">
          <span class="plan-chip-num">${entrenos}</span>
          <span class="plan-chip-label">entrenamientos</span>
        </div>
        <div class="plan-chip descanso">
          <span class="plan-chip-num">${descansos}</span>
          <span class="plan-chip-label">descansos</span>
        </div>
        ${completados > 0 ? `
          <div class="plan-chip completado">
            <span class="plan-chip-num">${completados}</span>
            <span class="plan-chip-label">completados</span>
          </div>
        ` : ''}
        ${vacios > 0 ? `
          <div class="plan-chip vacio">
            <span class="plan-chip-num">${vacios}</span>
            <span class="plan-chip-label">sin asignar</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // PANEL SELECTOR DE RUTINA
  // ─────────────────────────────────────────────

  function _renderSelectorRutina() {
    // Rutinas de otros días de la semana (para reutilizar)
    const rutinasEnUso = _planSemana
      .filter(d => d.rutina_id && d.fecha !== _diaSeleccionado)
      .map(d => ({
        id: d.rutina_id,
        nombre: d.rutinas?.nombre || _rutinas.find(r => r.id === d.rutina_id)?.nombre || '',
        grupo: d.rutinas?.grupo_principal || '',
        fromFecha: d.fecha,
        fromLabel: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][_planSemana.indexOf(d)]
      }))
      .filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i); // dedup

    return `
      <div class="plan-selector">
        <div class="plan-selector-header">
          <h3 id="plan-selector-titulo">Asignar rutina</h3>
          <button onclick="planificador.cerrarSelector()">✕</button>
        </div>

        <div class="plan-selector-seccion">
          <div class="plan-selector-label">✍️ Escribir rutina manualmente</div>
          <div class="form-row">
            <input class="form-input" id="plan-manual-nombre" placeholder="Nombre de rutina">
            <input class="form-input" id="plan-manual-duracion" type="number" placeholder="Duración (min)">
          </div>
          <input class="form-input" id="plan-manual-nota" placeholder="Nota opcional">
          <button class="btn-primary" onclick="planificador.guardarManual()">Guardar en este día</button>
        </div>

        <!-- OPCIÓN: DESCANSO -->
        <button class="plan-selector-opcion descanso-opcion"
          onclick="planificador.asignarDescanso()">
          <span class="plan-opc-icon">😴</span>
          <div>
            <div class="plan-opc-nombre">Día de descanso</div>
            <div class="plan-opc-sub">Sin entrenamiento</div>
          </div>
        </button>

        <!-- REUTILIZAR DE ESTA SEMANA -->
        ${rutinasEnUso.length > 0 ? `
          <div class="plan-selector-seccion">
            <div class="plan-selector-label">↩ Reutilizar de esta semana</div>
            ${rutinasEnUso.map(r => `
              <button class="plan-selector-opcion reutilizar-opcion"
                onclick="planificador.asignarRutina('${r.id}')">
                <span class="plan-opc-icon">↩</span>
                <div>
                  <div class="plan-opc-nombre">${r.nombre}</div>
                  <div class="plan-opc-sub">${r.fromLabel} · ${r.grupo}</div>
                </div>
              </button>
            `).join('')}
          </div>
        ` : ''}
        ${_rutinasFavoritas.length > 0 ? `
          <div class="plan-selector-seccion">
            <div class="plan-selector-label">⭐ Seleccionar de favoritos</div>
            ${_rutinasFavoritas.map(r => `<button class="plan-selector-opcion" onclick="planificador.asignarRutina('${r.id}')"><span class="plan-opc-icon">⭐</span><div><div class="plan-opc-nombre">${r.nombre}</div></div></button>`).join('')}
          </div>
        ` : ''}

        <!-- CATÁLOGO COMPLETO -->
        <div class="plan-selector-seccion">
          <div class="plan-selector-label">⚡ Sesión preestablecida recomendada</div>
          <div class="plan-selector-buscador">
            <input type="text" id="plan-buscador"
              class="form-input plan-input-buscar"
              placeholder="Buscar rutina..."
              oninput="planificador.filtrarRutinas(this.value)">
          </div>
          <div id="plan-lista-rutinas">
            ${_renderListaRutinas(_rutinas)}
          </div>
        </div>
      </div>
    `;
  }

  function _renderListaRutinas(lista) {
    if (lista.length === 0) {
      return `<div class="plan-selector-vacio">No se encontraron rutinas</div>`;
    }
    return lista.map(r => `
      <button class="plan-selector-opcion"
        onclick="planificador.asignarRutina('${r.id}')">
        <span class="plan-opc-icon">${_iconGrupo(r.grupo_principal || '')}</span>
        <div>
          <div class="plan-opc-nombre">${r.nombre}</div>
          <div class="plan-opc-sub">
            ${r.grupo_principal || ''} 
            ${r.duracion_minutos ? `· ⏱ ${r.duracion_minutos} min` : ''}
            ${r.nivel ? `· ${r.nivel}` : ''}
          </div>
        </div>
        <span class="plan-opc-check" style="display:none">✓</span>
      </button>
    `).join('');
  }

  // ─────────────────────────────────────────────
  // ACCIONES DE PLANIFICACIÓN
  // ─────────────────────────────────────────────

  function abrirSelector(fecha) {
    _diaSeleccionado = fecha;
    const panel = document.getElementById('plan-selector-panel');
    if (!panel) return;

    // Actualizar titulo
    const [y, m, d] = fecha.split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const titulo = document.getElementById('plan-selector-titulo');
    if (titulo) titulo.textContent = `${parseInt(d)} ${meses[parseInt(m)-1]}`;

    // Re-render del selector con contexto del día elegido
    panel.innerHTML = _renderSelectorRutina();
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cerrarSelector() {
    const panel = document.getElementById('plan-selector-panel');
    if (panel) panel.style.display = 'none';
    _diaSeleccionado = null;
  }

  async function asignarRutina(rutinaId) {
    if (!_diaSeleccionado) return;
    await _guardarDia(_diaSeleccionado, rutinaId, 'pendiente');
    cerrarSelector();
    await _cargarDatos();
    const container = document.getElementById('screen-planificador');
    _renderVista(container);
    window.mostrarToast?.('✓ Rutina asignada', 'success');
  }

  async function asignarDescanso() {
    if (!_diaSeleccionado) return;
    await _guardarDia(_diaSeleccionado, null, 'descanso');
    cerrarSelector();
    await _cargarDatos();
    const container = document.getElementById('screen-planificador');
    _renderVista(container);
    window.mostrarToast?.('Día marcado como descanso 😴', 'success');
  }
  async function guardarManual() {
    const nombre = document.getElementById('plan-manual-nombre')?.value?.trim();
    const dur = parseInt(document.getElementById('plan-manual-duracion')?.value) || null;
    const nota = document.getElementById('plan-manual-nota')?.value?.trim() || null;
    if (!nombre || !_diaSeleccionado) return;
    const { data, error } = await window.db.from('rutinas').insert({ usuario_id: _userId, nombre, duracion_minutos: dur, notas: nota, es_template: false }).select('id').maybeSingle();
    if (error || !data?.id) return;
    await asignarRutina(data.id);
  }

  async function quitarDia(fecha) {
    const { error } = await window.db
      .from('calendario')
      .delete()
      .eq('usuario_id', _userId)
      .eq('fecha', fecha);

    if (!error) {
      await _cargarDatos();
      const container = document.getElementById('screen-planificador');
      _renderVista(container);
      window.mostrarToast?.('Día eliminado', 'info');
    }
  }

  // "Usar como hoy": copia la rutina de ese día al día de hoy
  async function usarHoy(fechaOrigen, rutinaId) {
    const hoy = _hoy();
    if (fechaOrigen === hoy) return;
    await _guardarDia(hoy, rutinaId, 'pendiente');
    await _cargarDatos();
    const container = document.getElementById('screen-planificador');
    _renderVista(container);
    window.mostrarToast?.('✓ Rutina copiada a hoy', 'success');
  }

  // Abre el selector de día destino para copiar una rutina
  function abrirCopiarA(fechaOrigen, rutinaId) {
    _mostrarModalCopiarA(fechaOrigen, rutinaId);
  }

  function _mostrarModalCopiarA(fechaOrigen, rutinaId) {
    const existing = document.getElementById('modal-copiar-a');
    if (existing) existing.remove();

    const diasDisponibles = _planSemana.filter(d => d.fecha !== fechaOrigen);
    const nombresDia = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

    const modal = document.createElement('div');
    modal.id = 'modal-copiar-a';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Copiar rutina a...</h3>
          <button onclick="document.getElementById('modal-copiar-a').remove()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          ${diasDisponibles.map((dia, i) => {
            const idx = _planSemana.indexOf(dia);
            const [y, m, d] = dia.fecha.split('-');
            const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
            return `
              <button class="plan-copiar-dia-btn"
                onclick="planificador.copiarRutinaA('${rutinaId}', '${dia.fecha}')">
                <span class="plan-copiar-dia-nombre">${nombresDia[idx]}</span>
                <span class="plan-copiar-dia-fecha">${parseInt(d)} ${meses[parseInt(m)-1]}</span>
                ${dia.rutina_id ? `<span class="plan-copiar-overwrite">Reemplaza rutina actual</span>` : ''}
              </button>
            `;
          }).join('')}
          <div class="plan-copiar-divider">Otras semanas</div>
          <button class="plan-copiar-dia-btn"
            onclick="planificador.copiarRutinaA('${rutinaId}', null, 1)">
            <span>📅 Próxima semana</span>
            <span class="plan-copiar-sub">Elegir día...</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async function copiarRutinaA(rutinaId, fechaDestino, semanaDestino = null) {
    document.getElementById('modal-copiar-a')?.remove();

    if (semanaDestino !== null) {
      // Navegar a esa semana y abrir el selector
      _semanaOffset = _semanaOffset + semanaDestino;
      await _cargarDatos();
      const container = document.getElementById('screen-planificador');
      _renderVista(container);
      // Pre-seleccionar la rutina en el selector del lunes siguiente
      window.mostrarToast?.('Selecciona el día destino para copiar la rutina', 'info');
      // Guardamos la rutina "pendiente de pegar" en sessionStorage para uso simple
      sessionStorage.setItem('plan_rutina_copiar', rutinaId);
      return;
    }

    await _guardarDia(fechaDestino, rutinaId, 'pendiente');
    await _cargarDatos();
    const container = document.getElementById('screen-planificador');
    _renderVista(container);
    window.mostrarToast?.('✓ Rutina copiada', 'success');
  }

  // Copiar toda la semana anterior a la semana actual
  async function copiarSemanaAnterior() {
    const diasActuales = _getDiasSemana();
    const diasAnteriores = _getDiasSemana(-1);

    // Cargar planificación de la semana anterior
    const { data } = await window.db
      .from('calendario')
      .select('fecha, rutina_id, estado')
      .eq('usuario_id', _userId)
      .gte('fecha', diasAnteriores[0])
      .lte('fecha', diasAnteriores[6]);

    if (!data || data.length === 0) {
      window.mostrarToast?.('La semana anterior no tiene rutinas para copiar', 'info');
      return;
    }

    // Mapear: mismo índice de día, nueva fecha
    let copiados = 0;
    for (const diaAnterior of data) {
      if (!diaAnterior.rutina_id) continue;
      const idxDia = diasAnteriores.indexOf(diaAnterior.fecha);
      if (idxDia === -1) continue;
      const fechaDestino = diasActuales[idxDia];
      // No sobreescribir días ya planificados
      const yaExiste = _planSemana.find(d => d.fecha === fechaDestino && d.rutina_id);
      if (yaExiste) continue;
      await _guardarDia(fechaDestino, diaAnterior.rutina_id, 'pendiente');
      copiados++;
    }

    await _cargarDatos();
    const container = document.getElementById('screen-planificador');
    _renderVista(container);
    window.mostrarToast?.(
      copiados > 0
        ? `✓ ${copiados} rutina${copiados !== 1 ? 's' : ''} copiada${copiados !== 1 ? 's' : ''} de la semana anterior`
        : 'No había rutinas nuevas para copiar',
      copiados > 0 ? 'success' : 'info'
    );
  }

  async function limpiarSemana() {
    const confirmar = confirm('¿Limpiar toda la planificación de esta semana? Solo se eliminarán los días pendientes.');
    if (!confirmar) return;

    const dias = _getDiasSemana();
    const { error } = await window.db
      .from('calendario')
      .delete()
      .eq('usuario_id', _userId)
      .in('fecha', dias)
      .in('estado', ['pendiente', 'descanso', 'reprogramado']);

    if (!error) {
      await _cargarDatos();
      const container = document.getElementById('screen-planificador');
      _renderVista(container);
      window.mostrarToast?.('Semana limpiada', 'info');
    }
  }

  function filtrarRutinas(query) {
    const lista = query.trim()
      ? _rutinas.filter(r =>
          r.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (r.grupo_principal || '').toLowerCase().includes(query.toLowerCase())
        )
      : _rutinas;

    const container = document.getElementById('plan-lista-rutinas');
    if (container) container.innerHTML = _renderListaRutinas(lista);
  }

  // ─────────────────────────────────────────────
  // NAVEGACIÓN ENTRE SEMANAS
  // ─────────────────────────────────────────────

  async function navegarSemana(delta) {
    _semanaOffset += delta;
    const container = document.getElementById('screen-planificador');
    if (container) container.innerHTML = `<div class="loading-state"><div class="loader"></div></div>`;
    await _cargarDatos();
    _renderVista(container);
  }

  // ─────────────────────────────────────────────
  // GUARDAR EN SUPABASE
  // ─────────────────────────────────────────────

  async function _guardarDia(fecha, rutinaId, estado) {
    const { error } = await window.db
      .from('calendario')
      .upsert({
        usuario_id:   _userId,
        fecha,
        rutina_id: rutinaId || null,
        estado:    estado || 'pendiente',
        updated_at: new Date().toISOString()
      }, { onConflict: 'usuario_id,fecha' });

    if (error) {
      console.error('[planificador] Error guardando día:', error.message);
      window.mostrarToast?.('Error al guardar. Intenta de nuevo.', 'error');
      return false;
    }
    return true;
  }

  // ─────────────────────────────────────────────
  // HELPERS DE FECHAS
  // ─────────────────────────────────────────────

  function _hoy() {
    return new Date().toISOString().split('T')[0];
  }

  function _getDiasSemana(offsetExtra = 0) {
    const offset = _semanaOffset + offsetExtra;
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun...
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes + offset * 7);
    lunes.setHours(0,0,0,0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }

  function _etiquetaSemana() {
    const dias = _getDiasSemana();
    const [ly, lm, ld] = dias[0].split('-');
    const [dy, dm, dd] = dias[6].split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    if (lm === dm) {
      return `${parseInt(ld)}–${parseInt(dd)} ${meses[parseInt(lm)-1]} ${ly}`;
    }
    return `${parseInt(ld)} ${meses[parseInt(lm)-1]} – ${parseInt(dd)} ${meses[parseInt(dm)-1]}`;
  }

  // ─────────────────────────────────────────────
  // HELPERS UI
  // ─────────────────────────────────────────────

  function _iconGrupo(grupo) {
    const g = (grupo || '').toLowerCase();
    if (g.includes('pecho'))   return '💪';
    if (g.includes('espalda')) return '🔙';
    if (g.includes('pierna'))  return '🦵';
    if (g.includes('hombro'))  return '🏋️';
    if (g.includes('brazo'))   return '💪';
    if (g.includes('abdomen') || g.includes('core')) return '🔥';
    if (g.includes('full') || g.includes('completo')) return '⚡';
    return '🏃';
  }

  function _estadoLabel(estado) {
    const l = { completado: '✓ Completado', perdido: '✗ Perdido', descanso: '😴 Descanso', pendiente: '• Pendiente' };
    return l[estado] || estado;
  }

  // ─────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────

  return {
    render,
    navegarSemana,
    abrirSelector,
    cerrarSelector,
    asignarRutina,
    asignarDescanso,
    quitarDia,
    usarHoy,
    abrirCopiarA,
    copiarRutinaA,
    copiarSemanaAnterior,
    limpiarSemana,
    filtrarRutinas,
    guardarManual
  };
})();

// Funciones globales para el router
window.renderPlanificador = function renderPlanificador() {
  planificador.render();
};

window.initPlanificador = function initPlanificador() {
  planificador.render();
};
