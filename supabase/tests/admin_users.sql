begin;
do $$
declare v_token uuid; v_result jsonb;
begin
  update private.admin_settings set pin_hash=extensions.crypt('test-admin-pin',extensions.gen_salt('bf'));
  insert into private.app_users(username,pass_hash,nombre,bar) values('cleanup_fixture','fixture','Fixture','Fixture');
  insert into private.players(username,points) values('cleanup_fixture',123);
  insert into private.sessions(username) values('cleanup_fixture') returning token into v_token;
  v_result:=public.app_admin_delete_user('wrong','cleanup_fixture');
  if v_result->>'error'<>'pin' then raise exception 'Unauthenticated deactivation accepted'; end if;
  v_result:=public.app_admin_delete_user('test-admin-pin','demo');
  if v_result->>'error'<>'builtin' then raise exception 'Demo account can be removed'; end if;
  v_result:=public.app_admin_delete_user('test-admin-pin','cleanup_fixture');
  if not (v_result->>'ok')::boolean then raise exception 'Deactivation failed'; end if;
  if exists(select 1 from private.app_users where username='cleanup_fixture' and active) then raise exception 'Client still active'; end if;
  if not exists(select 1 from private.players where username='cleanup_fixture' and points=123) then raise exception 'Player history was deleted'; end if;
  if exists(select 1 from private.sessions where token=v_token and expires_at>now()) then raise exception 'Session still valid'; end if;
  if exists(select 1 from public.app_admin_users('test-admin-pin') where username='cleanup_fixture') then raise exception 'Inactive client still in admin list'; end if;
  raise notice 'Safe client deactivation and preserved history passed';
end $$;
rollback;
