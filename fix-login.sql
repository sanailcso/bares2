-- OBSOLETO: no ejecutar en la instalación nueva.
-- La versión canónica está en supabase/migrations/20260903093000_reconstruct_backend.sql.

-- ============================================================
-- TIKI TAKA · fix-login.sql
-- Sustituye app_login / app_resume / app_state por versiones
-- ROBUSTAS que leen la fila de players como JSON y no dependen
-- de los nombres exactos de las columnas (password/pass, nombre…).
-- Ejecuta TODO este archivo en Supabase → SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 0) Asegura que existe la infraestructura de sesiones
--    (por si ejecutas esto sin haber corrido seguridad.sql antes)
-- ------------------------------------------------------------
create table if not exists public.sessions (
  token      uuid primary key default gen_random_uuid(),
  username   text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists sessions_username_idx on public.sessions(username);
create index if not exists sessions_expires_idx  on public.sessions(expires_at);
alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;

drop function if exists public.fn_sessions_gc();
create or replace function public.fn_sessions_gc() returns void
language sql security definer set search_path = public as $$
  delete from public.sessions where expires_at < now();
$$;

drop function if exists public.fn_auth_token(uuid);
create or replace function public.fn_auth_token(p_token uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v_user text;
begin
  perform public.fn_sessions_gc();
  select s.username into v_user
    from public.sessions s
   where s.token = p_token and s.expires_at > now();
  return v_user;
end$$;

-- ------------------------------------------------------------
-- 1) LOGIN robusto
--    · Busca al usuario por players.username (esa columna sí es fija)
--    · Compara la contraseña contra la columna que exista:
--      password → pass → (si usas hash, ver nota al final)
--    · Devuelve nombre/bar/state con fallbacks, sin dar error si falta alguna
-- ------------------------------------------------------------
drop function if exists public.app_login(text, text);
create or replace function public.app_login(p_username text, p_password text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_row    jsonb;
  v_token  uuid;
  v_user   text;
  v_stored text;
begin
  select to_jsonb(t) into v_row
    from public.players t
   where t.username = lower(trim(p_username))
   limit 1;

  if v_row is null then
    return json_build_object('ok', false, 'error', 'credentials');
  end if;

  -- columna de contraseña: usa la que exista en tu tabla
  v_stored := coalesce(v_row->>'password', v_row->>'pass');

  if v_stored is null or v_stored <> p_password then
    return json_build_object('ok', false, 'error', 'credentials');
  end if;
  -- NOTA si usas hash pgcrypto en vez de texto plano, sustituye el IF anterior por:
  --   if v_row->>'pass_hash' is null or v_row->>'pass_hash' <> crypt(p_password, v_row->>'pass_hash') then
  --     return json_build_object('ok', false, 'error', 'credentials');
  --   end if;

  v_user := v_row->>'username';

  insert into public.sessions (username) values (v_user)
  returning token into v_token;

  return json_build_object(
    'ok',     true,
    'token',  v_token,
    'nombre', coalesce(v_row->>'nombre', v_user),
    'bar',    coalesce(v_row->>'bar', v_row->>'nombre', v_user),
    'state',  coalesce(v_row->'state', '{}'::jsonb)
  );
end$$;

-- ------------------------------------------------------------
-- 2) REANUDAR SESIÓN robusto
-- ------------------------------------------------------------
drop function if exists public.app_resume(uuid);
create or replace function public.app_resume(p_token uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_user text;
  v_row  jsonb;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;

  select to_jsonb(t) into v_row from public.players t where t.username = v_user limit 1;
  if v_row is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;

  return json_build_object(
    'ok',     true,
    'nombre', coalesce(v_row->>'nombre', v_user),
    'bar',    coalesce(v_row->>'bar', v_row->>'nombre', v_user),
    'state',  coalesce(v_row->'state', '{}'::jsonb)
  );
end$$;

-- ------------------------------------------------------------
-- 3) ESTADO DEL JUGADOR robusto (polling de sincronización)
-- ------------------------------------------------------------
drop function if exists public.app_state(uuid);
create or replace function public.app_state(p_token uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_user text;
  v_row  jsonb;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;

  select to_jsonb(t) into v_row from public.players t where t.username = v_user limit 1;
  if v_row is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;

  return json_build_object(
    'ok',        true,
    'points',    coalesce((v_row->>'points')::int, 0),
    'streak',    coalesce((v_row->>'streak')::int, 0),
    'lastSpin',  v_row->>'last_spin',
    'betSpins',  coalesce((v_row->>'betSpins')::int, (v_row->'state'->>'betSpins')::int, 0),
    'betsToday', coalesce((v_row->>'betsToday')::int, 0)
  );
end$$;

-- ------------------------------------------------------------
-- 4) Permisos de ejecución + recarga de esquema
-- ------------------------------------------------------------
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_resume(uuid)      to anon, authenticated;
grant execute on function public.app_state(uuid)       to anon, authenticated;

notify pgrst, 'reload schema';

-- ============================================================
-- 5) DIAGNÓSTICO (ejecuta DESPUÉS lo que necesites, una a una)
-- ============================================================
-- a) Prueba directa con un usuario real (sustituye valores):
--      select public.app_login('tu_usuario', 'tu_password');
--    · Si devuelve {"ok": true, "token": ...}  → login arreglado.
--    · Si devuelve {"ok": false, "error": "credentials"} → la contraseña
--      no coincide con la columna leída (¿usas hash? ver NOTA en app_login).
--    · Si devuelve un ERROR en rojo → cópialo: ese es el motivo exacto.
--
-- b) Ver columnas reales de tu tabla players:
--      select column_name, data_type from information_schema.columns
--      where table_schema='public' and table_name='players' order by ordinal_position;
--
-- c) Ver que las funciones existen con la firma correcta:
--      select p.proname, pg_get_function_arguments(p.oid)
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname='public' and p.proname in ('app_login','app_resume','app_state','fn_auth_token');
--
-- d) Si la app sigue diciendo "el servidor no pudo procesar el login"
--    justo después de ejecutar este archivo: espera ~60 segundos y reintenta
--    (PostgREST tarda en recargar el esquema), o ejecuta de nuevo:
--      notify pgrst, 'reload schema';
-- ============================================================
