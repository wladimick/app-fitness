-- defatfit_email_triggers.sql
-- DeFatFit v7 — Triggers de base de datos para notificaciones automáticas por email
--
-- IMPORTANTE: Ejecutar DESPUÉS de defatfit_supabase_schema_v7.sql
-- Ejecutar en Supabase > SQL Editor
--
-- Estos triggers llaman a la Edge Function enviar-email automáticamente
-- cuando ocurren eventos en la base de datos, sin necesidad de lógica en el frontend.
--
-- REQUISITO: La extensión pg_net debe estar habilitada en tu proyecto Supabase.
-- Verificar en: Supabase > Database > Extensions > pg_net (habilitar si no está)

-- =========================================================
-- 0) HABILITAR pg_net (si no está)
-- =========================================================

create extension if not exists pg_net;

-- =========================================================
-- 1) FUNCIÓN BASE: llama a la Edge Function enviar-email
-- =========================================================

create or replace function public.trigger_enviar_email(
  tipo       text,
  email_dest text,
  datos      jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  edge_url text;
  service_role_key text;
begin
  -- Obtener la URL y clave del proyecto desde configuración de Supabase
  -- Estas variables están disponibles automáticamente en funciones security definer
  edge_url := current_setting('app.supabase_url', true) || '/functions/v1/enviar-email';
  service_role_key := current_setting('app.service_role_key', true);

  -- Si no están configuradas, usar las variables de entorno estándar
  if edge_url is null or edge_url = '/functions/v1/enviar-email' then
    -- Fallback: loguear el intento para debugging
    raise notice '[trigger_enviar_email] Llamada a email: tipo=%, dest=%', tipo, email_dest;
    return;
  end if;

  -- Llamar a la Edge Function de forma asíncrona con pg_net
  perform net.http_post(
    url     := edge_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body    := jsonb_build_object(
      'tipo',         tipo,
      'destinatario', email_dest,
      'datos',        datos
    )::text
  );

exception when others then
  -- No bloquear la operación principal si el email falla
  raise notice '[trigger_enviar_email] Error al enviar email tipo=%: %', tipo, sqlerrm;
end;
$$;

-- =========================================================
-- ALTERNATIVA RECOMENDADA: Configurar la URL manualmente
-- Ejecuta esto con tus datos reales:
-- =========================================================
-- alter database postgres set app.supabase_url = 'https://TU_REF.supabase.co';
-- alter database postgres set app.service_role_key = 'TU_SERVICE_ROLE_KEY';
-- =========================================================


-- =========================================================
-- 2) TRIGGER: NUEVO USUARIO (bienvenida)
--    Se activa cuando se crea un perfil nuevo
-- =========================================================

create or replace function public.trg_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Email de bienvenida al usuario
  perform public.trigger_enviar_email(
    'bienvenida',
    new.email,
    jsonb_build_object('nombre', coalesce(new.nombre, split_part(new.email, '@', 1)))
  );

  -- Aviso al admin (best effort)
  -- Cambia el email del admin aquí o configúralo como variable de entorno en la Edge Function
  perform public.trigger_enviar_email(
    'bienvenida_admin',
    current_setting('app.admin_email', true),
    jsonb_build_object(
      'nombre', coalesce(new.nombre, split_part(new.email, '@', 1)),
      'email',  new.email,
      'fecha',  to_char(now(), 'DD/MM/YYYY HH24:MI')
    )
  );

  return new;
exception when others then
  return new; -- No bloquear el registro si el email falla
end;
$$;

drop trigger if exists on_perfil_creado_email on public.perfiles;
create trigger on_perfil_creado_email
  after insert on public.perfiles
  for each row
  execute procedure public.trg_perfil_nuevo_usuario();


-- =========================================================
-- 3) TRIGGER: CAMBIO DE ESTADO DE CUENTA
--    Se activa cuando cambia el campo `estado` en perfiles
-- =========================================================

create or replace function public.trg_perfil_cambio_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_usuario text;
begin
  -- Solo actuar si realmente cambió el estado
  if old.estado = new.estado then return new; end if;

  nombre_usuario := coalesce(new.nombre, split_part(new.email, '@', 1));

  case new.estado
    when 'suspendido' then
      perform public.trigger_enviar_email(
        'cuenta_suspendida',
        new.email,
        jsonb_build_object('nombre', nombre_usuario)
      );
    when 'activo' then
      -- Solo enviar reactivación si venía de suspendido
      if old.estado = 'suspendido' then
        perform public.trigger_enviar_email(
          'cuenta_reactivada',
          new.email,
          jsonb_build_object('nombre', nombre_usuario)
        );
      end if;
    when 'baja' then
      perform public.trigger_enviar_email(
        'cuenta_baja',
        new.email,
        jsonb_build_object('nombre', nombre_usuario)
      );
    else
      null; -- No hacer nada para otros estados
  end case;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_perfil_estado_cambiado on public.perfiles;
create trigger on_perfil_estado_cambiado
  after update of estado on public.perfiles
  for each row
  execute procedure public.trg_perfil_cambio_estado();


-- =========================================================
-- 4) TRIGGER: NUEVA SUSCRIPCIÓN O CAMBIO DE ESTADO
--    Se activa cuando se crea o actualiza una suscripción
-- =========================================================

create or replace function public.trg_suscripcion_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil_row  public.perfiles%rowtype;
  plan_row    public.planes_suscripcion%rowtype;
  nombre_user text;
  fecha_fmt   text;
begin
  -- Obtener datos del usuario
  select * into perfil_row from public.perfiles where id = new.user_id;
  select * into plan_row   from public.planes_suscripcion where id = new.plan_id;

  nombre_user := coalesce(perfil_row.nombre, split_part(perfil_row.email, '@', 1));
  fecha_fmt   := to_char(new.fecha_termino, 'DD/MM/YYYY');

  -- INSERT: suscripción nueva
  if TG_OP = 'INSERT' then
    case new.estado
      when 'trial' then
        perform public.trigger_enviar_email(
          'trial_activado',
          perfil_row.email,
          jsonb_build_object(
            'nombre', nombre_user,
            'plan',   coalesce(plan_row.nombre, new.plan_id),
            'fecha',  fecha_fmt
          )
        );
      when 'activa' then
        perform public.trigger_enviar_email(
          'plan_adquirido',
          perfil_row.email,
          jsonb_build_object(
            'nombre', nombre_user,
            'plan',   coalesce(plan_row.nombre, new.plan_id),
            'fecha',  fecha_fmt
          )
        );
      else null;
    end case;

  -- UPDATE: cambio de estado
  elsif TG_OP = 'UPDATE' and old.estado <> new.estado then
    case new.estado
      when 'activa' then
        -- Solo si venía de pendiente (pago recién aprobado)
        if old.estado = 'pendiente' then
          perform public.trigger_enviar_email(
            'plan_adquirido',
            perfil_row.email,
            jsonb_build_object(
              'nombre', nombre_user,
              'plan',   coalesce(plan_row.nombre, new.plan_id),
              'fecha',  fecha_fmt
            )
          );
        end if;
      when 'cancelada' then
        perform public.trigger_enviar_email(
          'plan_cancelado',
          perfil_row.email,
          jsonb_build_object(
            'nombre', nombre_user,
            'plan',   coalesce(plan_row.nombre, new.plan_id),
            'fecha',  fecha_fmt
          )
        );
      when 'vencida' then
        perform public.trigger_enviar_email(
          'plan_vencido',
          perfil_row.email,
          jsonb_build_object(
            'nombre', nombre_user,
            'plan',   coalesce(plan_row.nombre, new.plan_id),
            'fecha',  fecha_fmt
          )
        );
      else null;
    end case;
  end if;

  return new;
exception when others then
  raise notice '[trg_suscripcion_cambio] Error: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_suscripcion_cambio on public.suscripciones;
create trigger on_suscripcion_cambio
  after insert or update of estado on public.suscripciones
  for each row
  execute procedure public.trg_suscripcion_cambio();


-- =========================================================
-- 5) TRIGGER: PAGO PROCESADO
--    Se activa cuando se registra un pago en la tabla pagos
-- =========================================================

create or replace function public.trg_pago_procesado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil_row public.perfiles%rowtype;
  sub_row    public.suscripciones%rowtype;
  plan_row   public.planes_suscripcion%rowtype;
  nombre_user text;
begin
  -- Solo actuar cuando cambia el estado
  if TG_OP = 'UPDATE' and old.estado = new.estado then return new; end if;

  select * into perfil_row from public.perfiles where id = new.user_id;
  nombre_user := coalesce(perfil_row.nombre, split_part(perfil_row.email, '@', 1));

  if new.suscripcion_id is not null then
    select * into sub_row  from public.suscripciones      where id = new.suscripcion_id;
    select * into plan_row from public.planes_suscripcion  where id = sub_row.plan_id;
  end if;

  case new.estado
    when 'aprobado' then
      perform public.trigger_enviar_email(
        'pago_aprobado',
        perfil_row.email,
        jsonb_build_object(
          'nombre', nombre_user,
          'plan',   coalesce(plan_row.nombre, ''),
          'fecha',  to_char(coalesce(sub_row.fecha_termino, current_date), 'DD/MM/YYYY'),
          'monto',  coalesce(new.monto::text, '')
        )
      );
    when 'rechazado', 'fallido' then
      perform public.trigger_enviar_email(
        'pago_fallido',
        perfil_row.email,
        jsonb_build_object(
          'nombre', nombre_user,
          'plan',   coalesce(plan_row.nombre, '')
        )
      );
    else null;
  end case;

  return new;
exception when others then
  raise notice '[trg_pago_procesado] Error: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_pago_procesado on public.pagos;
create trigger on_pago_procesado
  after insert or update of estado on public.pagos
  for each row
  execute procedure public.trg_pago_procesado();


-- =========================================================
-- 6) FUNCIÓN MANUAL: Enviar recordatorio de vencimiento
--    Ejecutar con un cron job o manualmente
--    Envía avisos a usuarios cuyo plan vence en N días
-- =========================================================

create or replace function public.enviar_recordatorios_vencimiento(dias_antes int default 3)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  rec     record;
  contador int := 0;
  nombre_user text;
begin
  for rec in
    select
      s.user_id,
      s.fecha_termino,
      s.plan_id,
      p.nombre as plan_nombre,
      pf.email,
      pf.nombre
    from public.suscripciones s
    join public.planes_suscripcion p  on p.id = s.plan_id
    join public.perfiles pf           on pf.id = s.user_id
    where s.estado in ('trial', 'activa')
      and s.fecha_termino = current_date + dias_antes
  loop
    nombre_user := coalesce(rec.nombre, split_part(rec.email, '@', 1));

    perform public.trigger_enviar_email(
      'plan_por_vencer',
      rec.email,
      jsonb_build_object(
        'nombre', nombre_user,
        'plan',   rec.plan_nombre,
        'fecha',  to_char(rec.fecha_termino, 'DD/MM/YYYY'),
        'dias',   dias_antes
      )
    );

    contador := contador + 1;
  end loop;

  raise notice '[enviar_recordatorios_vencimiento] Enviados % recordatorios', contador;
  return contador;
end;
$$;

-- Para ejecutar manualmente cuando quieras:
-- select public.enviar_recordatorios_vencimiento(3); -- avisa 3 días antes
-- select public.enviar_recordatorios_vencimiento(1); -- avisa 1 día antes

-- Para automatizarlo con pg_cron (si tienes la extensión habilitada):
-- select cron.schedule('recordatorios-vencimiento', '0 9 * * *',
--   $$ select public.enviar_recordatorios_vencimiento(3); $$
-- );


-- =========================================================
-- 7) CONFIGURAR variables de la app
--    Reemplaza con tus datos reales y ejecuta
-- =========================================================

-- alter database postgres set app.supabase_url       = 'https://TU_REF.supabase.co';
-- alter database postgres set app.service_role_key   = 'TU_SERVICE_ROLE_KEY';
-- alter database postgres set app.admin_email        = 'tu@email.com';
