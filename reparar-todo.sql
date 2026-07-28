-- ============================================================
-- TIKI TAKA · reparar-todo.sql   (SOLUCIÓN DEFINITIVA)
--
-- DIAGNÓSTICO CONFIRMADO:
--   Las credenciales NUNCA estuvieron en players, sino en app_users
--   (username, pass_hash bcrypt, nombre, bar, is_builtin).
--   seguridad.sql sobrescribió tu app_login real con una PLANTILLA de
--   ejemplo que consultaba "players.password", columna que no existe.
--   Por eso fallan todos los logins, viejos y nuevos.
--
-- QUÉ HACE ESTE SCRIPT:
--   1. Reconstruye app_login contra app_users con bcrypt.
--   2. Reconstruye app_resume.
--   3. Amplia _auth() para que acepte contraseña O token de sesion,
--      así toda tu lógica de juego sigue intacta sin tocarla.
--   4. Genera automáticamente las versiones con p_token de app_spin,
--      app_redeem, app_bet, etc. (las que la app ya está llamando).
--   5. Cierra el acceso a las versiones antiguas con contraseña.
--
-- Ejecuta el fichero ENTERO. La última sentencia es un informe.
-- ============================================================


-- ------------------------------------------------------------
-- 1) Sesiones (por si acaso) y helper de token
-- ------------------------------------------------------------
create table if not exists public.sessions (
  token      uuid primary key default gen_random_uuid(),
  username   text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;

create or replace function public.fn_sessions_gc() returns void
language sql security definer set search_path = public, extensions as $$
  delete from public.sessions where expires_at < now();
$$;

create or replace function public.fn_auth_token(p_token uuid)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_user text;
begin
  if p_token is null then return null; end if;
  perform public.fn_sessions_gc();
  select s.username into v_user
    from public.sessions s
   where s.token = p_token and s.expires_at > now();
  return v_user;
end$$;


-- ------------------------------------------------------------
-- 2) _auth ampliado: acepta CONTRASEÑA o TOKEN de sesión
--    Gracias a esto, app_spin/app_redeem/app_bet/... siguen
--    funcionando con su lógica original sin reescribirlas.
-- ------------------------------------------------------------
drop function if exists public._auth(text, text);
create or replace function public._auth(p_username text, p_password text)
returns public.app_users
language plpgsql security definer set search_path = public, extensions as $$
declare
  u      public.app_users;
  v_hit  text;
begin
  select * into u from public.app_users
   where username = lower(trim(coalesce(p_username,'')));
  if not found then
    raise exception 'auth';
  end if;

  -- a) contraseña normal (bcrypt)
  if u.pass_hash is not null
     and u.pass_hash = crypt(coalesce(p_password,''), u.pass_hash) then
    return u;
  end if;

  -- b) token de sesión válido pasado en el sitio de la contraseña
  if coalesce(p_password,'') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select s.username into v_hit
      from public.sessions s
     where s.token = p_password::uuid
       and s.expires_at > now()
       and s.username = u.username;
    if v_hit is not null then
      return u;
    end if;
  end if;

  raise exception 'auth';
end$$;


-- ------------------------------------------------------------
-- 3) app_login CORRECTO: valida contra app_users
-- ------------------------------------------------------------
drop function if exists public.app_login(text, text);
create or replace function public.app_login(p_username text, p_password text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  u       public.app_users;
  p       public.players;
  v_token uuid;
begin
  begin
    u := public._auth(p_username, p_password);
  exception when others then
    return json_build_object('ok', false, 'error', 'credentials');
  end;

  -- asegurar fila de estado de juego
  if not exists (select 1 from public.players where username = u.username) then
    insert into public.players (username, points, streak, day_offset, state, created_at, updated_at)
    values (u.username, 0, 0, 0, '{}'::jsonb, now(), now());
  end if;

  select * into p from public.players where username = u.username;

  insert into public.sessions (username) values (u.username)
  returning token into v_token;

  return json_build_object(
    'ok',     true,
    'token',  v_token,
    'nombre', coalesce(u.nombre, u.username),
    'bar',    coalesce(u.bar, u.nombre, u.username),
    'state',  coalesce(p.state, '{}'::jsonb) || jsonb_build_object(
                'points',    coalesce(p.points, 0),
                'streak',    coalesce(p.streak, 0),
                'lastSpin',  p.last_spin,
                'dayOffset', coalesce(p.day_offset, 0),
                'betSpins',  coalesce(p.bet_spins, 0))
  );
end$$;


-- ------------------------------------------------------------
-- 4) app_resume: reanudar sesión con token
-- ------------------------------------------------------------
drop function if exists public.app_resume(uuid);
create or replace function public.app_resume(p_token uuid)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user text;
  u      public.app_users;
  p      public.players;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then
    return json_build_object('ok', false, 'error', 'auth');
  end if;

  select * into u from public.app_users where username = v_user;
  if not found then
    return json_build_object('ok', false, 'error', 'auth');
  end if;

  select * into p from public.players where username = v_user;

  return json_build_object(
    'ok',     true,
    'nombre', coalesce(u.nombre, u.username),
    'bar',    coalesce(u.bar, u.nombre, u.username),
    'state',  coalesce(p.state, '{}'::jsonb) || jsonb_build_object(
                'points',    coalesce(p.points, 0),
                'streak',    coalesce(p.streak, 0),
                'lastSpin',  p.last_spin,
                'dayOffset', coalesce(p.day_offset, 0),
                'betSpins',  coalesce(p.bet_spins, 0))
  );
end$$;


-- ------------------------------------------------------------
-- 5) GENERADOR AUTOMÁTICO de las versiones con p_token
--    Crea app_spin(p_token), app_redeem(p_token,...), etc.
--    reutilizando tus funciones originales sin tocar su lógica.
-- ------------------------------------------------------------
do $do$
declare
  r          record;
  v_args     text;
  v_call     text;
  v_types    text;
  v_sql      text;
  v_fail     text;
  v_nm       text;
  v_ty       text;
  i          int;
  v_nreq     int;
begin
  for r in
    select p.oid,
           p.proname,
           p.proretset,
           p.pronargs,
           p.pronargdefaults,
           p.proargnames,
           p.proargtypes,
           pg_get_function_result(p.oid)              as ret,
           pg_get_function_identity_arguments(p.oid)  as ident
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('app_spin','app_redeem','app_cancel_redeem','app_bet',
                         'app_claim_credits','app_save_state','app_pick_box',
                         'app_leaderboard','app_push_subscribe','app_state')
       and p.pronargs >= 2
       and p.proargnames[1] = 'p_username'
       and p.proargnames[2] = 'p_password'
  loop
    v_args  := 'p_token uuid';
    v_types := 'uuid';
    v_call  := 'v_user, p_token::text';
    v_nreq  := r.pronargs - coalesce(r.pronargdefaults, 0);

    for i in 3 .. r.pronargs loop
      v_nm := r.proargnames[i];
      v_ty := format_type(r.proargtypes[i-1], null);
      v_args  := v_args  || ', ' || quote_ident(v_nm) || ' ' || v_ty
                 || case when i > v_nreq then ' default null' else '' end;
      v_types := v_types || ', ' || v_ty;
      v_call  := v_call  || ', ' || quote_ident(v_nm);
    end loop;

    -- quitar una version anterior con la misma firma
    execute format('drop function if exists public.%I(%s)', r.proname, v_types);

    if r.proretset then
      v_sql := format(
$f$create or replace function public.%I(%s)
returns %s
language plpgsql security definer set search_path = public, extensions as $body$
declare v_user text;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then return; end if;
  return query select * from public.%I(%s);
end$body$;$f$,
        r.proname, v_args, r.ret, r.proname, v_call);
    else
      if r.ret = 'jsonb' then
        v_fail := $x$return jsonb_build_object('ok',false,'error','auth');$x$;
      elsif r.ret = 'json' then
        v_fail := $x$return json_build_object('ok',false,'error','auth');$x$;
      else
        v_fail := $x$raise exception 'auth';$x$;
      end if;

      v_sql := format(
$f$create or replace function public.%I(%s)
returns %s
language plpgsql security definer set search_path = public, extensions as $body$
declare v_user text; v_res %s;
begin
  v_user := public.fn_auth_token(p_token);
  if v_user is null then %s end if;
  v_res := public.%I(%s);
  return v_res;
end$body$;$f$,
        r.proname, v_args, r.ret, r.ret, v_fail, r.proname, v_call);
    end if;

    execute v_sql;

    -- permisos: abrir la nueva, cerrar la antigua
    execute format('grant execute on function public.%I(%s) to anon, authenticated',
                   r.proname, v_types);
    execute format('revoke execute on function public.%I(%s) from anon, authenticated',
                   r.proname, r.ident);
  end loop;
end $do$;


-- ------------------------------------------------------------
-- 6) Permisos de las funciones de entrada
-- ------------------------------------------------------------
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_resume(uuid)      to anon, authenticated;
grant execute on function public.fn_auth_token(uuid)   to anon, authenticated;
revoke execute on function public._auth(text, text)    from anon, authenticated;

notify pgrst, 'reload schema';


-- ------------------------------------------------------------
-- 7) ¿No recuerdas la contraseña de ningún usuario?
--    Descomenta y ejecuta esta línea para ponerle una conocida:
-- ------------------------------------------------------------
-- update public.app_users
--    set pass_hash = extensions.crypt('1234', extensions.gen_salt('bf'))
--  where username = 'manolo';


-- ------------------------------------------------------------
-- 8) INFORME FINAL (última sentencia: su resultado sí se ve)
-- ------------------------------------------------------------
drop function if exists public.informe_final();
create or replace function public.informe_final()
returns table(apartado text, detalle text)
language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  for r in
    select p.proname as nom, pg_get_function_arguments(p.oid) as args
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname='public'
       and (p.proname like 'app\_%' or p.proname = '_auth')
       and pg_get_function_arguments(p.oid) like '%p_token%'
     order by p.proname
  loop
    apartado := '1. funciones con token';
    detalle  := r.nom || '(' || r.args || ')';
    return next;
  end loop;

  for r in
    select username, nombre, bar, is_builtin,
           case when pass_hash is null then 'SIN HASH'
                when pass_hash like '$2%' then 'bcrypt ok'
                else 'formato raro' end as est
      from public.app_users order by username
  loop
    apartado := '2. usuarios (app_users)';
    detalle  := r.username || ' | ' || coalesce(r.nombre,'-') || ' | ' ||
                coalesce(r.bar,'-') || ' | ' || r.est ||
                case when r.is_builtin then ' | integrado' else '' end;
    return next;
  end loop;

  apartado := '3. siguiente paso';
  detalle  := 'Entra en la app con un usuario de la lista. Si no recuerdas '
           || 'la contraseña, usa el bloque 7 de este fichero.';
  return next;
  return;
end$$;

select * from public.informe_final();
