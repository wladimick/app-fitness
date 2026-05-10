async function initAdmin() {
  const p = window.currentProfile;
  if (!p || p.rol !== 'admin') { goScreen('screen-inicio'); return; }
  const c = document.getElementById('screen-admin'); if (!c) return;
  const [usuarios, suscripciones, consejos, mensajes, suplementos] = await Promise.all([
    profileService.obtenerTodosLosPerfiles(),
    subscriptionService.obtenerTodasLasSuscripciones(),
    contentService.obtenerConsejosAdmin(),
    contentService.obtenerMensajesAdmin(),
    supplementService.obtenerSuplementos()
  ]);

  c.innerHTML = UI.topbar({ title: 'Admin', subtitle: 'Gestión' }) + `<div class='screen-content'>
  <div class='sec-label'>Usuarios</div>
  ${(usuarios||[]).map(u=>`<div class='card' style='margin-bottom:8px'><b>${u.nombre||u.email}</b><div style='font-size:12px;color:var(--muted)'>${u.email} · ${u.rol} · ${u.estado||'activo'}</div><button class='btn-secondary btn-sm' onclick="adminCambiarRol('${u.id}','${u.rol==='admin'?'usuario':'admin'}')">Rol ${u.rol==='admin'?'usuario':'admin'}</button></div>`).join('')}
  <div class='sec-label'>Publicar mensaje inicio</div>
  <input id='ad-msg-t' class='form-input' placeholder='Título'><textarea id='ad-msg-c' class='form-input' placeholder='Contenido'></textarea><button class='btn-primary' onclick='adminCrearMensaje()'>Publicar</button>
  <div class='sec-label'>Consejos</div>
  <input id='ad-con-t' class='form-input' placeholder='Título'><input id='ad-con-cat' class='form-input' placeholder='Categoría'><textarea id='ad-con-c' class='form-input' placeholder='Contenido'></textarea><button class='btn-primary' onclick='adminCrearConsejo()'>Guardar consejo</button>
  <div class='sec-label'>Resumen</div><div class='card'>Suscripciones: ${(suscripciones||[]).length} · Consejos: ${(consejos||[]).length} · Mensajes: ${(mensajes||[]).length} · Suplementos activos: ${(suplementos||[]).length}</div>
  </div>`;
}

async function adminCambiarRol(id, rol){ await window.db.from('perfiles').update({rol}).eq('id', id); initAdmin(); }
async function adminCrearMensaje(){
  const titulo=document.getElementById('ad-msg-t').value; const contenido=document.getElementById('ad-msg-c').value;
  const creado_por=window.currentUser?.id;
  await contentService.upsertMensaje({titulo,contenido,tipo:'novedad',activo:true,fecha_inicio:new Date().toISOString(),creado_por});
  showToast('Mensaje publicado'); initAdmin();
}
async function adminCrearConsejo(){
  const titulo=document.getElementById('ad-con-t').value, categoria=document.getElementById('ad-con-cat').value, contenido=document.getElementById('ad-con-c').value;
  await contentService.upsertConsejo({titulo,categoria,contenido,activo:true,fecha_publicacion:new Date().toISOString(),creado_por:window.currentUser?.id});
  showToast('Consejo guardado'); initAdmin();
}
window.initAdmin=initAdmin; window.adminCambiarRol=adminCambiarRol; window.adminCrearMensaje=adminCrearMensaje; window.adminCrearConsejo=adminCrearConsejo;
