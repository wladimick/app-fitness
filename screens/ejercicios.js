// Biblioteca + explorador + consejos
let _ejCatalogo = [];
let _misFavs = new Set();

async function initEjercicios() {
  const c = document.getElementById('screen-ejercicios');
  if (!c) return;
  c.innerHTML = UI.topbar({ title: 'Biblioteca', subtitle: 'Ejercicios, cuerpo y consejos' }) + `<div class="screen-content">
    <div class="ejercicios-filter-row">
      <div class="ejercicio-chip active" onclick="switchModuloEj('biblioteca', this)">Biblioteca</div>
      <div class="ejercicio-chip" onclick="switchModuloEj('explorador', this)">Explorador</div>
      <div class="ejercicio-chip" onclick="switchModuloEj('consejos', this)">Consejos</div>
    </div>
    <div id="ej-modulo"></div></div>`;
  await switchModuloEj('biblioteca', c.querySelector('.ejercicio-chip'));
}

async function switchModuloEj(mod, el) {
  if (el) {
    document.querySelectorAll('.ejercicio-chip').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
  }
  const m = document.getElementById('ej-modulo');
  if (!m) return;
  if (mod === 'explorador') return renderExplorador(m);
  if (mod === 'consejos') return renderConsejos(m);
  return renderBiblioteca(m);
}

async function renderBiblioteca(m) {
  const userId = window.currentUser?.id;
  _ejCatalogo = await exerciseService.obtenerEjercicios({ forzar: true });
  const { data: favs } = await window.db.from('favoritos_ejercicios').select('ejercicio_id').eq('usuario_id', userId);
  _misFavs = new Set((favs || []).map(f => f.ejercicio_id));
  const grupos = [...new Set(_ejCatalogo.map(e => e.grupo_muscular).filter(Boolean))];
  m.innerHTML = `<input id="ej-search" class="form-input" placeholder="Buscar ejercicio" oninput="filtrarBiblioteca()">
  <div style="display:flex;gap:8px;overflow:auto;margin:8px 0">${['todos', ...grupos].map(g=>`<button class="btn-secondary btn-sm" onclick="setFiltroGrupo('${g}')">${g}</button>`).join('')}</div>
  <div id="ej-list"></div>`;
  window._filtroGrupo = 'todos';
  filtrarBiblioteca();
}
function setFiltroGrupo(g){ window._filtroGrupo = g; filtrarBiblioteca(); }
function filtrarBiblioteca(){
  const q=(document.getElementById('ej-search')?.value||'').toLowerCase();
  const list=document.getElementById('ej-list'); if(!list) return;
  const rows=_ejCatalogo.filter(e=>(window._filtroGrupo==='todos'||e.grupo_muscular===window._filtroGrupo)&&(!q||e.nombre.toLowerCase().includes(q)));
  list.innerHTML = rows.map(e=>`<div class="ejercicio-card"><div class="ejercicio-info"><div class="ejercicio-nombre">${e.nombre}</div><div class="ejercicio-meta">${e.grupo_muscular||''} · ${e.nivel||'—'} · ${e.equipamiento||'—'}</div></div><div><button class="btn-ghost btn-sm" onclick="toggleFavorito('${e.id}')">${_misFavs.has(e.id)?'★':'☆'}</button><button class="btn-secondary btn-sm" onclick="agregarEjercicioPlan('${e.id}')">＋</button></div></div>`).join('');
}

async function toggleFavorito(ejId){
  const userId=window.currentUser?.id;
  if(_misFavs.has(ejId)){ await window.db.from('favoritos_ejercicios').delete().eq('usuario_id', userId).eq('ejercicio_id', ejId); _misFavs.delete(ejId); }
  else { await window.db.from('favoritos_ejercicios').upsert({usuario_id:userId, ejercicio_id:ejId}); _misFavs.add(ejId); }
  filtrarBiblioteca();
}

async function agregarEjercicioPlan(ejId){
  const fecha = prompt('Fecha YYYY-MM-DD para guardar en calendario'); if(!fecha) return;
  const userId=window.currentUser?.id;
  await window.db.from('calendario').upsert({usuario_id:userId, fecha, estado:'pendiente', metadata:{ejercicio_id:ejId}},{onConflict:'usuario_id,fecha'});
  showToast('Ejercicio agregado al día');
}

async function renderExplorador(m){
  const {data:musculos=[]}=await window.db.from('musculos').select('*').eq('activo',true);
  m.innerHTML=`<div class='sec-label'>Explorador de cuerpo</div><div style='display:flex;flex-wrap:wrap;gap:8px'>${musculos.map(mu=>`<button class='btn-secondary btn-sm' onclick="verMusculo('${mu.nombre.replace(/'/g,"\\'")}')">${mu.nombre}</button>`).join('')}</div><div id='musculo-res'></div>`;
}
async function verMusculo(nombre){
  const {data=[]}=await window.db.from('ejercicios_catalogo').select('*').ilike('grupo_muscular',`%${nombre}%`).eq('activo',true).limit(20);
  document.getElementById('musculo-res').innerHTML=data.map(e=>`<div class='card' style='margin-top:8px'><b>${e.nombre}</b><div style='font-size:12px;color:var(--muted)'>${e.grupo_muscular||''}</div></div>`).join('')||UI.empty({title:'Sin ejercicios',body:'No hay ejercicios para este músculo aún'});
}

async function renderConsejos(m){
  const cats=['Suplementos','Movilidad','Cardio post ejercicio','Recuperación','Nutrición','Técnica','OCR / eventos'];
  const items = await contentService.obtenerConsejosPublicos();
  m.innerHTML = `<div style='display:flex;gap:8px;overflow:auto'>${['Todos',...cats].map(c=>`<button class='btn-secondary btn-sm' onclick="filtroConsejo('${c}')">${c}</button>`).join('')}</div><div id='consejos-list'></div>`;
  window._consejos = items;
  filtroConsejo('Todos');
}
function filtroConsejo(cat){
  const l=document.getElementById('consejos-list'); if(!l) return;
  const rows=(window._consejos||[]).filter(c=>cat==='Todos'||c.categoria===cat);
  l.innerHTML=rows.map(c=>`<div class='card' style='margin-top:10px'><div style='font-size:11px;color:var(--accent)'>${c.categoria||'General'}</div><div style='font-weight:700'>${c.titulo}</div><div style='font-size:13px;color:var(--muted)'>${c.contenido||''}</div></div>`).join('')||UI.empty({title:'Sin consejos',body:'No hay consejos activos para esta categoría'});
}

window.initEjercicios=initEjercicios; window.switchModuloEj=switchModuloEj; window.filtrarBiblioteca=filtrarBiblioteca; window.setFiltroGrupo=setFiltroGrupo; window.toggleFavorito=toggleFavorito; window.agregarEjercicioPlan=agregarEjercicioPlan; window.verMusculo=verMusculo; window.filtroConsejo=filtroConsejo;
