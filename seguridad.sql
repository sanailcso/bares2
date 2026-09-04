-- OBSOLETO: no ejecutar en la instalación nueva.
-- La versión canónica está en supabase/migrations/20260903093000_reconstruct_backend.sql.

-- ============================================================
-- TIKI TAKA · endurecimiento de seguridad (v55)
-- 1) RLS estricto: la anon key ya no puede leer/escribir tablas
-- 2) Sesiones con token: login devuelve token; el resto de RPCs
--    se autentican SOLO con p_token (adiós usuario+contraseña por llamada)
--
-- ⚠️ IMPORTANTE: este script asume que ya tienes tus funciones
--    app_* creadas (secure-setup.sql). Las partes 3 y 5 son
--    PLANTILLAS: conserva la lógica de juego de tus funciones
--    actuales y cambia únicamente la autenticación como se indica.
--    Ejecuta en Supabase → SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1) RLS ESTRICTO (esto es lo que cierra de verdad las vías legacy)
--    Con esto, aunque alguien tenga la anon key, no puede tocar
--    las tablas directamente: todo pasa por funciones RPC
--    security definer.
-- ------------------------------------------------------------
alter table if exists public.players      enable row level security;
alter table if exists public.config       enable row level security;
alter table if exists public.events       enable row level security;
alter table if exists public.redemptions  enable row level security;

-- Quita cualquier política permisiva anterior (ajusta nombres si difieren)
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('players','config','events','redemptions')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Sin políticas nuevas = nadie accede vía REST directo (ni anon ni authenticated).
-- Las funciones security definer siguen funcionando porque se ejecutan
-- con los permisos del propietario de la función.
revoke all on public.players     from anon, authenticated;
revoke all on public.config      from anon, authenticated;
revoke all on public.events      from anon, authenticated;
revoke all on public.redemptions from anon, authenticated;

-- ------------------------------------------------------------
-- 2) TABLA DE SESIONES
-- ------------------------------------------------------------
create table if not exists public.sessions (
  token      uuid primary key default gen_random_uuid(),
  username   text not null references public.players(username) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists sessions_username_idx on public.sessions(username);
create index if not exists sessions_expires_idx  on public.sessions(expires_at);

alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;

-- Limpieza oportunista de sesiones caducadas
drop function if exists public.fn_sessions_gc();
create or replace function public.fn_sessions_gc() returns void
language sql security definer set search_path = public as $$
  delete from public.sessions where expires_at < now();
$$;

-- ------------------------------------------------------------
-- 3) HELPER DE AUTENTICACIÓN POR TOKEN
--    Devuelve el username si el token es válido; null en otro caso.
-- ------------------------------------------------------------
drop function if exists public.fn_auth_token(uuid);
create or replace function public.fn_auth_token(p_token uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_user text;
begin
  perform public.fn_sessions_gc();
  select s.username into v_user
    from public.sessions s
   where s.token = p_token
     and s.expires_at > now();
  return v_user;
end$$;

-- ------------------------------------------------------------
-- 4) LOGIN CON TOKEN  ·  PLANTILLA
--    Conserva la VALIDACIÓN de contraseña de tu app_login actual
--    (idealmente con crypt() si ya guardas hashes) y añade la
--    creación de sesión + devolver el token.
-- ------------------------------------------------------------
-- Obligatorio: la versión antigua de app_login tiene otro tipo de retorno
-- y Postgres NO permite reemplazarla (error 42P13). Hay que borrarla primero.
drop function if exists public.app_login(text, text);
create or replace function public.app_login(p_username text, p_password text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_player public.players%rowtype;
  v_token  uuid;
begin
  -- ▶ MANTÉN AQUÍ tu validación actual de usuario/contraseña.
  --   Ejemplo si guardas la contraseña en texto plano (migra a hash!):
  select * into v_player from public.players where username = lower(trim(p_username));
  if not found or v_player.password <> p_password then
    return json_build_object('ok', false, 'error', 'credentials');
  end if;
  --   Ejemplo recomendado con hash (pgcrypto):
  --   if not found or v_player.pass_hash <> crypt(p_password, v_player.pass_hash) then ...

  -- ▶ NUEVO: crea la sesión y devuelve el token
  insert into public.sessions (username) values (v_player.username)
  returning token into v_token;

  return json_build_object(
    'ok',     true,
    'token',  v_token,
    'nombre', v_player.nombre,
    'bar',    v_player.bar,
    'state',  v_player.state
  );
end$$;

-- ------------------------------------------------------------
-- 5) REANUDAR SESIÓN (lo llama la app al arrancar)
-- ------------------------------------------------------------
drop function if exists public.app_resume(uuid);
create or replace function public.app_resume(p_token uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_user   text;
  v_player public.players%rowtype;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;
  select * into v_player from public.players where username = v_user;
  if not found then
    return json_build_object('ok', false, 'error', 'auth');
  end if;
  return json_build_object(
    'ok',     true,
    'nombre', v_player.nombre,
    'bar',    v_player.bar,
    'state',  v_player.state
  );
end$$;

-- ------------------------------------------------------------
-- 6) CÓMO ADAPTAR EL RESTO DE FUNCIONES (PLANTILLA)
--    En CADA una de estas funciones, cambia la firma y la
--    autenticación; el resto de la lógica se queda IGUAL:
--
--      app_spin(p_token uuid)
--      app_redeem(p_token uuid, p_prize text)
--      app_cancel_redeem(p_token uuid, p_prize text, p_id text)
--      app_bet(p_token uuid, p_stake int)
--      app_claim_credits(p_token uuid)
--      app_save_state(p_token uuid, p_state jsonb)
--      app_state(p_token uuid)
--      app_pick_box(p_token uuid)
--      app_leaderboard(p_token uuid, p_top int, p_period text)
--      app_push_subscribe(p_token uuid, p_sub jsonb)
--
--    ANTES (en cada función):
--      select ... where username = p_username and password = p_password
--      if not found then return json_build_object('ok',false);
--
--    DESPUÉS:
--      declare v_user text;
--      ...
--      v_user := public.fn_auth_token(p_token);
--      if v_user is null then
--        return json_build_object('ok', false, 'error', 'auth');
--      end if;
--      -- y usa v_user donde antes usabas p_username
--
--    EJEMPLO COMPLETO con app_state:
-- ------------------------------------------------------------
drop function if exists public.app_state(uuid);
create or replace function public.app_state(p_token uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_user   text;
  v_player public.players%rowtype;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;
  select * into v_player from public.players where username = v_user;
  -- ▶ Ajusta los campos devueltos a lo que tu app_state actual devuelve
  return json_build_object(
    'ok',        true,
    'points',    v_player.points,
    'streak',    v_player.streak,
    'lastSpin',  v_player.last_spin,
    'betSpins',  coalesce((v_player.state->>'betSpins')::int, 0),
    'betsToday', 0
  );
end$$;

-- ------------------------------------------------------------
-- 7) PERMISOS DE EJECUCIÓN (las RPC deben seguir siendo llamables)
-- ------------------------------------------------------------
grant execute on function public.app_login(text, text)  to anon, authenticated;
grant execute on function public.app_resume(uuid)       to anon, authenticated;
grant execute on function public.app_state(uuid)        to anon, authenticated;
-- Repite para el resto cuando las actualices:
-- grant execute on function public.app_spin(uuid)            to anon, authenticated;
-- grant execute on function public.app_redeem(uuid, text)    to anon, authenticated;
-- grant execute on function public.app_cancel_redeem(uuid, text, text) to anon, authenticated;
-- grant execute on function public.app_bet(uuid, int)        to anon, authenticated;
-- grant execute on function public.app_claim_credits(uuid)   to anon, authenticated;
-- grant execute on function public.app_save_state(uuid, jsonb) to anon, authenticated;
-- grant execute on function public.app_pick_box(uuid)        to anon, authenticated;
-- grant execute on function public.app_leaderboard(uuid, int, text) to anon, authenticated;
-- grant execute on function public.app_push_subscribe(uuid, jsonb) to anon, authenticated;

-- ------------------------------------------------------------
-- 8) OPCIONAL PERO RECOMENDADO
--   a) Borra las firmas ANTIGUAS (con p_password) DESPUÉS de crear las
--      nuevas con p_token, para que nadie pueda llamarlas:
--        drop function if exists public.app_spin(text, text);
--        drop function if exists public.app_redeem(text, text, text);
--        drop function if exists public.app_cancel_redeem(text, text, text, text);
--        drop function if exists public.app_bet(text, text, integer);
--        drop function if exists public.app_claim_credits(text, text);
--        drop function if exists public.app_save_state(text, text, jsonb);
--        drop function if exists public.app_state(text, text);
--        drop function if exists public.app_pick_box(text, text);
--        drop function if exists public.app_leaderboard(text, text, integer, text);
--        drop function if exists public.app_push_subscribe(text, text, jsonb);
--      Si alguna responde "function does not exist", mira la firma exacta en
--      Database → Functions y ajusta los tipos (p.ej. numeric en vez de integer).
--   b) Migra contraseñas a hash con pgcrypto:
--        create extension if not exists pgcrypto;
--        alter table public.players add column if not exists pass_hash text;
--        update public.players set pass_hash = crypt(password, gen_salt('bf')) where pass_hash is null;
--        -- y cambia la validación en app_login por crypt()
--   c) Borra la tabla/columna de contraseñas en claro cuando verifiques
--      que todo funciona.
-- ------------------------------------------------------------

-- Recarga el esquema de PostgREST para que coja los cambios:
notify pgrst, 'reload schema';
