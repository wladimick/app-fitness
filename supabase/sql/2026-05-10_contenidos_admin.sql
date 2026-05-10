-- Incremental: consejos + mensajes_inicio
create table if not exists public.consejos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null,
  contenido text not null,
  activo boolean not null default true,
  fecha_publicacion timestamptz not null default now(),
  creado_por uuid null references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mensajes_inicio (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text not null,
  tipo text not null default 'novedad',
  fecha_inicio timestamptz not null default now(),
  fecha_termino timestamptz null,
  link_url text null,
  boton_texto text null,
  activo boolean not null default true,
  creado_por uuid null references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consejos enable row level security;
alter table public.mensajes_inicio enable row level security;

do $$ begin
create policy consejos_select_public on public.consejos for select to authenticated using (
  activo = true and fecha_publicacion <= now() or exists(select 1 from public.perfiles p where p.id = auth.uid() and p.rol='admin')
);
exception when duplicate_object then null; end $$;

do $$ begin
create policy consejos_admin_all on public.consejos for all to authenticated using (
  exists(select 1 from public.perfiles p where p.id = auth.uid() and p.rol='admin')
) with check (
  exists(select 1 from public.perfiles p where p.id = auth.uid() and p.rol='admin')
);
exception when duplicate_object then null; end $$;

do $$ begin
create policy mensajes_select_public on public.mensajes_inicio for select to authenticated using (
  activo = true and fecha_inicio <= now() and (fecha_termino is null or fecha_termino >= now()) or exists(select 1 from public.perfiles p where p.id = auth.uid() and p.rol='admin')
);
exception when duplicate_object then null; end $$;

do $$ begin
create policy mensajes_admin_all on public.mensajes_inicio for all to authenticated using (
  exists(select 1 from public.perfiles p where p.id = auth.uid() and p.rol='admin')
) with check (
  exists(select 1 from public.perfiles p where p.id = auth.uid() and p.rol='admin')
);
exception when duplicate_object then null; end $$;
