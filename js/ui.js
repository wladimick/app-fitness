// js/ui.js
// DeFatFit — Constructores de UI compartidos entre todas las pantallas.
// Cada función devuelve un string HTML listo para asignar a innerHTML.

const UI = {

  // ── Topbar ──────────────────────────────────────────────────────────────
  // layout: 'default' = logo izquierda | 'center' = título centrado
  topbar({ title, subtitle = '', layout = 'default', back = null, actions = '' } = {}) {
    const hamburger = `
      <button class="icon-btn menu-btn" onclick="openSidebar()" aria-label="Abrir menú" aria-expanded="false">
        <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>`;

    const backBtn = back ? `
      <button class="icon-btn" onclick="${back}" aria-label="Volver">
        <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg>
      </button>` : '';

    if (layout === 'center') {
      return `
        <div class="topbar topbar--center">
          <div class="topbar-left">${backBtn || '<div style="width:40px"></div>'}</div>
          <div class="topbar-center">
            <div class="topbar-title">${title}</div>
            ${subtitle ? `<div class="topbar-sub">${subtitle}</div>` : ''}
          </div>
          <div class="topbar-right">${actions}${hamburger}</div>
        </div>`;
    }

    return `
      <div class="topbar">
        <div class="topbar-info">
          ${backBtn}
          <div>
            <div class="topbar-logo">${title}</div>
            ${subtitle ? `<div class="topbar-sub">${subtitle}</div>` : ''}
          </div>
        </div>
        <div class="topbar-right">${actions}${hamburger}</div>
      </div>`;
  },

  // ── Estados ─────────────────────────────────────────────────────────────
  loading(msg = 'Cargando…') {
    return `
      <div class="state-loading">
        <div class="state-spinner"></div>
        <p>${msg}</p>
      </div>`;
  },

  empty({ icon = '📭', title = 'Sin datos', body = '', action = '' } = {}) {
    return `
      <div class="state-empty">
        <div class="state-empty-icon">${icon}</div>
        <div class="state-empty-title">${title}</div>
        ${body ? `<p class="state-empty-body">${body}</p>` : ''}
        ${action}
      </div>`;
  },

  error({ msg = 'Ocurrió un error', retry = '' } = {}) {
    return `
      <div class="state-error">
        <div class="state-error-icon">⚠️</div>
        <p>${msg}</p>
        ${retry ? `<button class="btn-secondary btn-sm" onclick="${retry}">Reintentar</button>` : ''}
      </div>`;
  },

  // ── Secciones ────────────────────────────────────────────────────────────
  section(label, content) {
    return `<div class="sec-label">${label}</div>${content}`;
  },

  // ── Cards ────────────────────────────────────────────────────────────────
  card(content, cls = '') {
    return `<div class="card ${cls}">${content}</div>`;
  },

  infoRow(label, value, accent = false) {
    return `
      <div class="info-row">
        <span class="info-row-label">${label}</span>
        <span class="info-row-value ${accent ? 'info-row-accent' : ''}">${value}</span>
      </div>`;
  },

  // ── Badges ───────────────────────────────────────────────────────────────
  badge(text, color = 'gray') {
    return `<span class="badge badge-${color}">${text}</span>`;
  },

  // ── Stat mini ────────────────────────────────────────────────────────────
  statMini(val, label, id = '') {
    return `
      <div class="stat-mini">
        <div class="stat-mini-val" ${id ? `id="${id}"` : ''}>${val}</div>
        <div class="stat-mini-lbl">${label}</div>
      </div>`;
  },

  // ── Lista items ──────────────────────────────────────────────────────────
  listItem({ icon = '', title, sub = '', right = '', onclick = '' } = {}) {
    return `
      <div class="list-item ${onclick ? 'list-item--tap' : ''}" ${onclick ? `onclick="${onclick}"` : ''}>
        ${icon ? `<div class="list-item-icon">${icon}</div>` : ''}
        <div class="list-item-body">
          <div class="list-item-title">${title}</div>
          ${sub ? `<div class="list-item-sub">${sub}</div>` : ''}
        </div>
        ${right ? `<div class="list-item-right">${right}</div>` : ''}
      </div>`;
  },

  // ── Formularios ──────────────────────────────────────────────────────────
  field({ label, input } = {}) {
    return `
      <div class="form-field">
        <label class="form-label">${label}</label>
        ${input}
      </div>`;
  },

  input({ id, type = 'text', placeholder = '', value = '', step = '', min = '', attrs = '' } = {}) {
    return `<input class="form-input" id="${id}" type="${type}"
      ${placeholder ? `placeholder="${placeholder}"` : ''}
      ${value ? `value="${value}"` : ''}
      ${step ? `step="${step}"` : ''}
      ${min ? `min="${min}"` : ''}
      ${attrs}>`;
  },

  // ── Screen wrapper ───────────────────────────────────────────────────────
  screen(content) {
    return `<div class="screen-content">${content}</div>`;
  },

};

window.UI = UI;
