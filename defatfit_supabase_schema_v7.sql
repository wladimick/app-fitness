-- DeFatFit v7 - Esquema Supabase sugerido
-- Objetivo: conectar pagos, suscripciones, ejercicios, rutinas, alimentación,
-- suplementos, calendario y métricas Body Pro.
-- Ejecutar en Supabase SQL Editor. Revisar nombres si ya existen tablas previas.

create extension if not exists "pgcrypto";

-- =========================================================
-- 1) PERFIL BASE + FIX LOGIN/RLS
-- =========================================================

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.perfiles
  add column if not exists email text,
  add column if not exists nombre text,
  add column if not exists rol text not null default 'usuario' check (rol in ('usuario','admin','coach')),
  add column if not exists estado text not null default 'activo' check (estado in ('activo','suspendido','baja')),
  add column if not exists nivel text default 'principiante' check (nivel in ('principiante','intermedio','avanzado')),
  add column if not exists onboarding_completo boolean not null default false,
  add column if not exists objetivo text,
  add column if not exists frecuencia_semanal int default 4,
  add column if not exists peso_actual numeric(5,2),
  add column if not exists fecha_nacimiento date,
  add column if not exists racha int not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.perfiles enable row level security;
grant select, insert, update, delete on public.perfiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
      and p.estado = 'activo'
  );
$$;

-- Políticas de perfiles
DROP POLICY IF EXISTS "perfiles_select_own_or_admin" ON public.perfiles;
CREATE POLICY "perfiles_select_own_or_admin"
ON public.perfiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "perfiles_insert_own_or_admin" ON public.perfiles;
CREATE POLICY "perfiles_insert_own_or_admin"
ON public.perfiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "perfiles_update_own_or_admin" ON public.perfiles;
CREATE POLICY "perfiles_update_own_or_admin"
ON public.perfiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "perfiles_delete_admin" ON public.perfiles;
CREATE POLICY "perfiles_delete_admin"
ON public.perfiles FOR DELETE TO authenticated
USING (public.is_admin());

-- Trigger recomendado: crea perfil automáticamente al registrarse en Auth.
-- Esto evita el error: "Tu cuenta existe, pero no se pudo crear el perfil".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (
    id, email, nombre, rol, estado, nivel, onboarding_completo
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'usuario',
    'activo',
    'principiante',
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
exception when others then
  -- No bloquear el registro si falla la creación del perfil.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Para dejar tu usuario como admin, reemplaza el correo:
-- update public.perfiles set rol = 'admin' where lower(email) = lower('TU_CORREO_AQUI');


-- =========================================================
-- 2) PLANES, SUSCRIPCIONES Y PAGOS
-- =========================================================

create table if not exists public.planes_suscripcion (
  id text primary key, -- prueba_15, mensual, trimestral, anual
  nombre text not null,
  descripcion text,
  duracion_dias int not null,
  precio_clp int,
  es_trial boolean not null default false,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.planes_suscripcion (id, nombre, descripcion, duracion_dias, precio_clp, es_trial, orden)
values
  ('prueba_15', 'Prueba de 15 días', 'Acceso gratuito de prueba por 15 días.', 15, 0, true, 1),
  ('mensual', 'Mensual', 'Suscripción mensual.', 30, null, false, 2),
  ('trimestral', '3 meses', 'Suscripción por 3 meses.', 90, null, false, 3),
  ('anual', 'Anual', 'Suscripción anual.', 365, null, false, 4)
on conflict (id) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  duracion_dias = excluded.duracion_dias,
  es_trial = excluded.es_trial,
  orden = excluded.orden;

create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  plan_id text not null references public.planes_suscripcion(id),
  estado text not null default 'pendiente' check (estado in ('trial','activa','pendiente','vencida','cancelada','fallida')),
  fecha_inicio date not null default current_date,
  fecha_termino date not null,
  provider text default 'manual' check (provider in ('manual','mercadopago','paypal')),
  provider_subscription_id text,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suscripciones_user_id on public.suscripciones(user_id);
create index if not exists idx_suscripciones_estado on public.suscripciones(estado);
create unique index if not exists uq_suscripcion_activa_por_usuario
on public.suscripciones(user_id)
where estado in ('trial','activa','pendiente');

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  suscripcion_id uuid references public.suscripciones(id) on delete set null,
  provider text not null check (provider in ('manual','mercadopago','paypal')),
  provider_payment_id text,
  provider_subscription_id text,
  external_reference text,
  monto int,
  moneda text not null default 'CLP',
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado','fallido','reembolsado','cancelado')),
  fecha_pago timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pagos_user_id on public.pagos(user_id);
create index if not exists idx_pagos_suscripcion_id on public.pagos(suscripcion_id);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mercadopago','paypal')),
  event_id text,
  event_type text,
  payload jsonb not null,
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_payment_webhook_event
on public.payment_webhook_events(provider, event_id)
where event_id is not null;


-- =========================================================
-- 3) EJERCICIOS, RUTINAS Y SESIONES
-- =========================================================

create table if not exists public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo_muscular text not null,
  categoria text, -- pecho, espalda, piernas, hombros, brazos, abdomen, full_body
  equipo text,
  nivel text default 'intermedio' check (nivel in ('principiante','intermedio','avanzado')),
  instrucciones text,
  nota text,
  plan_b text,
  demo_url text,
  es_publico boolean not null default true,
  activo boolean not null default true,
  created_by uuid references public.perfiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ejercicios_categoria on public.ejercicios(categoria);
create index if not exists idx_ejercicios_grupo on public.ejercicios(grupo_muscular);

create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.perfiles(id) on delete cascade,
  nombre text not null,
  grupo_principal text,
  duracion_minutos int,
  nivel text default 'intermedio' check (nivel in ('principiante','intermedio','avanzado')),
  objetivo text,
  es_template boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rutinas_created_by on public.rutinas(created_by);
create index if not exists idx_rutinas_template on public.rutinas(es_template);

create table if not exists public.rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas(id) on delete cascade,
  ejercicio_id uuid references public.ejercicios(id) on delete set null,
  orden int not null default 1,
  nombre_override text,
  grupo_muscular_override text,
  series int not null default 3,
  repeticiones text not null default '10-12',
  peso_sugerido text default 'Libre',
  descanso_segundos int default 60,
  nota text,
  plan_b text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rutina_ejercicios_rutina on public.rutina_ejercicios(rutina_id);

create table if not exists public.planificacion_dias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  fecha date not null,
  rutina_id uuid references public.rutinas(id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente','completado','descanso','perdido','reprogramado')),
  resumen text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, fecha)
);

create index if not exists idx_planificacion_user_fecha on public.planificacion_dias(user_id, fecha);

create table if not exists public.sesiones_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  planificacion_id uuid references public.planificacion_dias(id) on delete set null,
  rutina_id uuid references public.rutinas(id) on delete set null,
  fecha date not null default current_date,
  estado text not null default 'en_progreso' check (estado in ('en_progreso','completada','cancelada')),
  inicio timestamptz default now(),
  termino timestamptz,
  duracion_minutos int,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sesiones_user_fecha on public.sesiones_entrenamiento(user_id, fecha);

create table if not exists public.sesion_ejercicios (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones_entrenamiento(id) on delete cascade,
  ejercicio_id uuid references public.ejercicios(id) on delete set null,
  nombre text not null,
  orden int not null default 1,
  completado boolean not null default false,
  series_programadas int,
  repeticiones_programadas text,
  peso_programado text,
  descanso_segundos int,
  series_realizadas jsonb not null default '[]'::jsonb,
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sesion_ejercicios_sesion on public.sesion_ejercicios(sesion_id);


-- =========================================================
-- 4) ALIMENTACIÓN, SUPLEMENTOS Y BODY PRO
-- =========================================================

create table if not exists public.alimentacion_grupos (
  id text primary key,
  label text not null,
  meta numeric(6,2) not null,
  unidad text not null,
  icon text,
  orden int not null default 0,
  activo boolean not null default true
);

insert into public.alimentacion_grupos (id, label, meta, unidad, icon, orden)
values
  ('proteinas', 'Proteínas', 10, 'porciones', 'protein', 1),
  ('cerealesCarbohidratos', 'Cereales / carbohidratos', 1.5, 'porciones', 'carbs', 2),
  ('verdurasLibreConsumo', 'Verduras libre consumo', 2, 'porciones', 'leaf', 3),
  ('verdurasGeneral', 'Verduras en general', 2, 'porciones', 'bowl', 4),
  ('frutas', 'Frutas', 1, 'porción', 'fruit', 5),
  ('lacteos', 'Lácteos', 1, 'porción', 'milk', 6),
  ('aceite', 'Aceite', 1, 'porción', 'drop', 7)
on conflict (id) do update set
  label = excluded.label,
  meta = excluded.meta,
  unidad = excluded.unidad,
  icon = excluded.icon,
  orden = excluded.orden;

create table if not exists public.alimentacion_registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  fecha date not null,
  agua_vasos int not null default 0,
  completo boolean not null default false,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, fecha)
);

create table if not exists public.alimentacion_porciones (
  id uuid primary key default gen_random_uuid(),
  registro_id uuid not null references public.alimentacion_registros(id) on delete cascade,
  grupo_id text not null references public.alimentacion_grupos(id),
  cantidad numeric(6,2) not null default 0,
  meta numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(registro_id, grupo_id)
);

create table if not exists public.suplementos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  para_que_sirve text,
  como_tomarlo text,
  dosis_general text,
  advertencia text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.suplementos (nombre, descripcion, para_que_sirve, como_tomarlo, dosis_general, advertencia)
values
  ('Creatina', 'Suplemento de apoyo al rendimiento de fuerza y potencia.', 'Ayuda a mejorar el rendimiento en ejercicios de alta intensidad y favorece la recuperación del entrenamiento.', 'Tomar todos los días. Puede ser con agua, jugo o junto a una comida.', '3 a 5 g al día, según indicación profesional.', 'Evitar si existe contraindicación médica o renal. Validar con nutricionista/médico.'),
  ('Magnesio', 'Mineral relacionado con función muscular, descanso y contracción muscular.', 'Puede apoyar la función muscular normal y el descanso.', 'Generalmente se toma en la noche o según indicación profesional.', 'Según formato del suplemento e indicación profesional.', 'No exceder dosis indicada. Consultar si hay problemas renales o uso de medicamentos.'),
  ('Proteína', 'Suplemento alimentario para ayudar a completar requerimientos diarios de proteína.', 'Sirve para llegar a la meta diaria de proteína cuando con comida no alcanza.', 'Usar como apoyo, no como reemplazo automático de comidas. Puede tomarse post-entreno o durante el día.', '1 porción según etiqueta y plan nutricional.', 'Ajustar a requerimiento individual. No reemplaza una dieta completa.')
on conflict (nombre) do update set
  descripcion = excluded.descripcion,
  para_que_sirve = excluded.para_que_sirve,
  como_tomarlo = excluded.como_tomarlo,
  dosis_general = excluded.dosis_general,
  advertencia = excluded.advertencia;

create table if not exists public.usuario_suplementos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  suplemento_id uuid not null references public.suplementos(id) on delete cascade,
  activo boolean not null default true,
  dosis_personalizada text,
  horario text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, suplemento_id)
);

create table if not exists public.metricas_body_pro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  fecha date not null default current_date,
  peso numeric(5,2),
  grasa_corporal numeric(5,2),
  masa_muscular numeric(5,2),
  agua_corporal numeric(5,2),
  grasa_visceral numeric(5,2),
  imc numeric(5,2),
  metabolismo_basal int,
  edad_corporal int,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_metricas_body_pro_user_fecha on public.metricas_body_pro(user_id, fecha desc);


-- =========================================================
-- 5) RLS PARA TABLAS NUEVAS
-- =========================================================

-- Catálogos visibles para usuarios autenticados; edición solo admin.
alter table public.planes_suscripcion enable row level security;
alter table public.ejercicios enable row level security;
alter table public.rutinas enable row level security;
alter table public.rutina_ejercicios enable row level security;
alter table public.alimentacion_grupos enable row level security;
alter table public.suplementos enable row level security;

-- Datos del usuario
alter table public.suscripciones enable row level security;
alter table public.pagos enable row level security;
alter table public.planificacion_dias enable row level security;
alter table public.sesiones_entrenamiento enable row level security;
alter table public.sesion_ejercicios enable row level security;
alter table public.alimentacion_registros enable row level security;
alter table public.alimentacion_porciones enable row level security;
alter table public.usuario_suplementos enable row level security;
alter table public.metricas_body_pro enable row level security;
alter table public.payment_webhook_events enable row level security;

-- Grants básicos
grant select on public.planes_suscripcion, public.ejercicios, public.rutinas, public.rutina_ejercicios, public.alimentacion_grupos, public.suplementos to authenticated;
grant select, insert, update, delete on public.suscripciones, public.pagos, public.planificacion_dias, public.sesiones_entrenamiento, public.sesion_ejercicios, public.alimentacion_registros, public.alimentacion_porciones, public.usuario_suplementos, public.metricas_body_pro to authenticated;

-- Planes de suscripción
DROP POLICY IF EXISTS "planes_select_auth" ON public.planes_suscripcion;
CREATE POLICY "planes_select_auth" ON public.planes_suscripcion FOR SELECT TO authenticated USING (activo = true OR public.is_admin());
DROP POLICY IF EXISTS "planes_admin_all" ON public.planes_suscripcion;
CREATE POLICY "planes_admin_all" ON public.planes_suscripcion FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Suscripciones y pagos
DROP POLICY IF EXISTS "suscripciones_own_or_admin" ON public.suscripciones;
CREATE POLICY "suscripciones_own_or_admin" ON public.suscripciones FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "pagos_own_or_admin" ON public.pagos;
CREATE POLICY "pagos_own_or_admin" ON public.pagos FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "webhook_events_admin_only" ON public.payment_webhook_events;
CREATE POLICY "webhook_events_admin_only" ON public.payment_webhook_events FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Ejercicios
DROP POLICY IF EXISTS "ejercicios_select_public_own_admin" ON public.ejercicios;
CREATE POLICY "ejercicios_select_public_own_admin" ON public.ejercicios FOR SELECT TO authenticated
USING (activo = true AND (es_publico = true OR created_by = auth.uid() OR public.is_admin()));
DROP POLICY IF EXISTS "ejercicios_insert_own_or_admin" ON public.ejercicios;
CREATE POLICY "ejercicios_insert_own_or_admin" ON public.ejercicios FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "ejercicios_update_own_or_admin" ON public.ejercicios;
CREATE POLICY "ejercicios_update_own_or_admin" ON public.ejercicios FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "ejercicios_delete_own_or_admin" ON public.ejercicios;
CREATE POLICY "ejercicios_delete_own_or_admin" ON public.ejercicios FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

-- Rutinas
DROP POLICY IF EXISTS "rutinas_select_template_own_admin" ON public.rutinas;
CREATE POLICY "rutinas_select_template_own_admin" ON public.rutinas FOR SELECT TO authenticated
USING ((activo = true AND es_template = true) OR created_by = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "rutinas_insert_own_or_admin" ON public.rutinas;
CREATE POLICY "rutinas_insert_own_or_admin" ON public.rutinas FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "rutinas_update_own_or_admin" ON public.rutinas;
CREATE POLICY "rutinas_update_own_or_admin" ON public.rutinas FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "rutinas_delete_own_or_admin" ON public.rutinas;
CREATE POLICY "rutinas_delete_own_or_admin" ON public.rutinas FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

-- Rutina ejercicios: acceso por rutina padre.
DROP POLICY IF EXISTS "rutina_ejercicios_select" ON public.rutina_ejercicios;
CREATE POLICY "rutina_ejercicios_select" ON public.rutina_ejercicios FOR SELECT TO authenticated
USING (exists (
  select 1 from public.rutinas r
  where r.id = rutina_id
    and ((r.activo = true and r.es_template = true) or r.created_by = auth.uid() or public.is_admin())
));
DROP POLICY IF EXISTS "rutina_ejercicios_write" ON public.rutina_ejercicios;
CREATE POLICY "rutina_ejercicios_write" ON public.rutina_ejercicios FOR ALL TO authenticated
USING (exists (select 1 from public.rutinas r where r.id = rutina_id and (r.created_by = auth.uid() or public.is_admin())))
WITH CHECK (exists (select 1 from public.rutinas r where r.id = rutina_id and (r.created_by = auth.uid() or public.is_admin())));

-- Tablas simples con user_id
DROP POLICY IF EXISTS "planificacion_own_or_admin" ON public.planificacion_dias;
CREATE POLICY "planificacion_own_or_admin" ON public.planificacion_dias FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sesiones_own_or_admin" ON public.sesiones_entrenamiento;
CREATE POLICY "sesiones_own_or_admin" ON public.sesiones_entrenamiento FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "alimentacion_registros_own_or_admin" ON public.alimentacion_registros;
CREATE POLICY "alimentacion_registros_own_or_admin" ON public.alimentacion_registros FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "usuario_suplementos_own_or_admin" ON public.usuario_suplementos;
CREATE POLICY "usuario_suplementos_own_or_admin" ON public.usuario_suplementos FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "metricas_body_pro_own_or_admin" ON public.metricas_body_pro;
CREATE POLICY "metricas_body_pro_own_or_admin" ON public.metricas_body_pro FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Tablas hijas por relación a tabla padre
DROP POLICY IF EXISTS "sesion_ejercicios_own_or_admin" ON public.sesion_ejercicios;
CREATE POLICY "sesion_ejercicios_own_or_admin" ON public.sesion_ejercicios FOR ALL TO authenticated
USING (exists (select 1 from public.sesiones_entrenamiento s where s.id = sesion_id and (s.user_id = auth.uid() or public.is_admin())))
WITH CHECK (exists (select 1 from public.sesiones_entrenamiento s where s.id = sesion_id and (s.user_id = auth.uid() or public.is_admin())));

DROP POLICY IF EXISTS "alimentacion_porciones_own_or_admin" ON public.alimentacion_porciones;
CREATE POLICY "alimentacion_porciones_own_or_admin" ON public.alimentacion_porciones FOR ALL TO authenticated
USING (exists (select 1 from public.alimentacion_registros r where r.id = registro_id and (r.user_id = auth.uid() or public.is_admin())))
WITH CHECK (exists (select 1 from public.alimentacion_registros r where r.id = registro_id and (r.user_id = auth.uid() or public.is_admin())));

-- Catálogos de alimentación y suplementos
DROP POLICY IF EXISTS "alimentacion_grupos_select_auth" ON public.alimentacion_grupos;
CREATE POLICY "alimentacion_grupos_select_auth" ON public.alimentacion_grupos FOR SELECT TO authenticated USING (activo = true OR public.is_admin());
DROP POLICY IF EXISTS "alimentacion_grupos_admin_all" ON public.alimentacion_grupos;
CREATE POLICY "alimentacion_grupos_admin_all" ON public.alimentacion_grupos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "suplementos_select_auth" ON public.suplementos;
CREATE POLICY "suplementos_select_auth" ON public.suplementos FOR SELECT TO authenticated USING (activo = true OR public.is_admin());
DROP POLICY IF EXISTS "suplementos_admin_all" ON public.suplementos;
CREATE POLICY "suplementos_admin_all" ON public.suplementos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =========================================================
-- 6) VISTA ÚTIL: SUSCRIPCIÓN ACTUAL
-- =========================================================

create or replace view public.v_suscripcion_actual as
select distinct on (s.user_id)
  s.user_id,
  s.id as suscripcion_id,
  s.plan_id,
  p.nombre as plan_nombre,
  s.estado,
  s.fecha_inicio,
  s.fecha_termino,
  case
    when s.estado in ('trial','activa') and s.fecha_termino >= current_date then true
    else false
  end as acceso_activo
from public.suscripciones s
join public.planes_suscripcion p on p.id = s.plan_id
order by s.user_id, s.fecha_termino desc, s.created_at desc;

-- Nota: las vistas pueden requerir ajustes adicionales de seguridad según el proyecto.
