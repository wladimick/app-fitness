async function initAdmin() {
  const p = window.currentProfile;
  if (!p || p.rol !== 'admin') { goScreen('screen-inicio'); return; }
  const c = document.getElementById('screen-admin'); if (!c) return;
  const [usuarios, suscripciones, consejos, mensajes, suplementos, rutinas, ejercicios] = await Promise.all([
    profileService.obtenerTodosLosPerfiles(),
    subscriptionService.obtenerTodasLasSuscripciones(),
    contentService.obtenerConsejosAdmin(),
    contentService.obtenerMensajesAdmin(),
    window.db.from('suplementos').select('*').then(r=>r.data||[]),
    window.db.from('rutinas').select('id').then(r=>r.data||[]),
    window.db.from('ejercicios_catalogo').select('id').then(r=>r.data||[]),
  ]);
  c.innerHTML = UI.topbar({ title: 'Admin', subtitle: 'Gestión' }) + `<div class='screen-content'>
  <div class='card'>Usuarios: ${usuarios.length} · Suscripciones: ${suscripciones.length} · Rutinas: ${rutinas.length} · Ejercicios: ${ejercicios.length} · Consejos: ${consejos.length} · Suplementos: ${suplementos.length}</div>
  <div class='sec-label'>Usuarios</div>
  ${(usuarios||[]).map(u=>`<div class='card' style='margin-bottom:8px'><b>${u.nombre||u.email}</b><div style='font-size:12px;color:var(--muted)'>${u.email} · ${u.rol} · ${u.estado||'activo'}</div><button class='btn-secondary btn-sm' onclick="adminCambiarRol('${u.id}','${u.rol==='admin'?'usuario':'admin'}')">Cambiar a ${u.rol==='admin'?'usuario':'admin'}</button></div>`).join('')}
  <div class='sec-label'>Mensajes inicio</div>
  <input id='ad-msg-id' type='hidden'><input id='ad-msg-t' class='form-input' placeholder='Título'><textarea id='ad-msg-c' class='form-input' placeholder='Contenido'></textarea><button class='btn-primary' onclick='adminGuardarMensaje()'>Guardar mensaje</button>
  ${(mensajes||[]).map(m=>`<div class='card' style='margin-top:8px'><b>${m.titulo}</b><div style='font-size:12px;color:var(--muted)'>${m.tipo||'novedad'} · ${m.activo?'activo':'inactivo'}</div><button class='btn-ghost btn-sm' onclick='adminEditarMensaje(${JSON.stringify(''+m.id)},${JSON.stringify(''+(m.titulo||''))},${JSON.stringify(''+(m.contenido||''))})'>Editar</button><button class='btn-secondary btn-sm' onclick="adminToggleMensaje('${m.id}', ${!m.activo})">${m.activo?'Desactivar':'Activar'}</button></div>`).join('')}
  <div class='sec-label'>Consejos</div>
  <input id='ad-con-id' type='hidden'><input id='ad-con-t' class='form-input' placeholder='Título'><input id='ad-con-cat' class='form-input' placeholder='Categoría'><textarea id='ad-con-c' class='form-input' placeholder='Contenido'></textarea><button class='btn-primary' onclick='adminGuardarConsejo()'>Guardar consejo</button>
  ${(consejos||[]).map(co=>`<div class='card' style='margin-top:8px'><b>${co.titulo}</b><div style='font-size:12px;color:var(--muted)'>${co.categoria||'General'} · ${co.activo?'activo':'inactivo'}</div><button class='btn-ghost btn-sm' onclick='adminEditarConsejo(${JSON.stringify(''+co.id)},${JSON.stringify(''+(co.titulo||''))},${JSON.stringify(''+(co.categoria||''))},${JSON.stringify(''+(co.contenido||''))})'>Editar</button><button class='btn-secondary btn-sm' onclick="adminToggleConsejo('${co.id}', ${!co.activo})">${co.activo?'Desactivar':'Activar'}</button></div>`).join('')}
  <div class='sec-label'>Suplementos</div>
  <input id='ad-sup-id' type='hidden'><input id='ad-sup-n' class='form-input' placeholder='ID (text)'><input id='ad-sup-nom' class='form-input' placeholder='Nombre'><textarea id='ad-sup-d' class='form-input' placeholder='Descripción / para qué sirve'></textarea><button class='btn-primary' onclick='adminGuardarSuplemento()'>Guardar suplemento</button>
  ${(suplementos||[]).map(s=>`<div class='card' style='margin-top:8px'><b>${s.nombre}</b><div style='font-size:12px;color:var(--muted)'>${s.categoria||'—'} · ${s.activo?'activo':'inactivo'}</div><button class='btn-ghost btn-sm' onclick='adminEditarSuplemento(${JSON.stringify(''+s.id)},${JSON.stringify(''+(s.nombre||''))},${JSON.stringify(''+(s.descripcion||''))})'>Editar</button><button class='btn-secondary btn-sm' onclick="adminToggleSuplemento('${s.id}', ${!s.activo})">${s.activo?'Desactivar':'Activar'}</button></div>`).join('')}
  </div>`;
}
async function adminCambiarRol(id, rol){ await window.db.from('perfiles').update({rol}).eq('id', id); initAdmin(); }
function adminEditarMensaje(id,t,c){document.getElementById('ad-msg-id').value=id;document.getElementById('ad-msg-t').value=t;document.getElementById('ad-msg-c').value=c;}
async function adminGuardarMensaje(){const id=document.getElementById('ad-msg-id').value||undefined;await contentService.upsertMensaje({id,titulo:ad_msg_t.value,contenido:ad_msg_c.value,tipo:'novedad',activo:true,fecha_inicio:new Date().toISOString(),creado_por:window.currentUser?.id});initAdmin();}
async function adminToggleMensaje(id,activo){await contentService.upsertMensaje({id,activo});initAdmin();}
function adminEditarConsejo(id,t,cat,c){ad_con_id.value=id;ad_con_t.value=t;ad_con_cat.value=cat;ad_con_c.value=c;}
async function adminGuardarConsejo(){const id=ad_con_id.value||undefined;await contentService.upsertConsejo({id,titulo:ad_con_t.value,categoria:ad_con_cat.value||'General',contenido:ad_con_c.value,activo:true,fecha_publicacion:new Date().toISOString(),creado_por:window.currentUser?.id});initAdmin();}
async function adminToggleConsejo(id,activo){await contentService.upsertConsejo({id,activo});initAdmin();}
function adminEditarSuplemento(id,n,d){ad_sup_id.value=id;ad_sup_n.value=id;ad_sup_nom.value=n;ad_sup_d.value=d;}
async function adminGuardarSuplemento(){const id=ad_sup_n.value;await window.db.from('suplementos').upsert({id,nombre:ad_sup_nom.value,descripcion:ad_sup_d.value,activo:true});initAdmin();}
async function adminToggleSuplemento(id,activo){await window.db.from('suplementos').update({activo}).eq('id',id);initAdmin();}
window.initAdmin=initAdmin;window.adminCambiarRol=adminCambiarRol;window.adminEditarMensaje=adminEditarMensaje;window.adminGuardarMensaje=adminGuardarMensaje;window.adminToggleMensaje=adminToggleMensaje;window.adminEditarConsejo=adminEditarConsejo;window.adminGuardarConsejo=adminGuardarConsejo;window.adminToggleConsejo=adminToggleConsejo;window.adminEditarSuplemento=adminEditarSuplemento;window.adminGuardarSuplemento=adminGuardarSuplemento;window.adminToggleSuplemento=adminToggleSuplemento;
