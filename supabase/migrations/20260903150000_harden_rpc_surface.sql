begin;

-- Las funciones privilegiadas viven fuera del esquema expuesto. Las funciones
-- public.app_* son wrappers SECURITY INVOKER: PostgREST puede llamarlas, pero
-- no publica directamente código SECURITY DEFINER.
grant usage on schema private to anon;

alter function public.app_public_config() set schema private;
alter function public.app_login(text,text) set schema private;
alter function public.app_resume(uuid) set schema private;
alter function public.app_logout(uuid) set schema private;
alter function public.app_state(uuid) set schema private;
alter function public.app_save_state(uuid,jsonb) set schema private;
alter function public.app_spin(uuid) set schema private;
alter function public.app_pick_box(uuid) set schema private;
alter function public.app_bet(uuid,bigint) set schema private;
alter function public.app_redeem(uuid,text) set schema private;
alter function public.app_cancel_redeem(uuid,text,text) set schema private;
alter function public.app_claim_credits(uuid) set schema private;
alter function public.app_change_password(text,text,text) set schema private;
alter function public.app_leaderboard(uuid,integer,text) set schema private;
alter function public.app_push_subscribe(uuid,jsonb) set schema private;
alter function public.app_admin_check(text) set schema private;
alter function public.app_admin_push_subscribe(text,jsonb) set schema private;
alter function public.app_admin_redemptions(text) set schema private;
alter function public.app_admin_set_delivered(text,text,boolean) set schema private;
alter function public.app_admin_save_config(text,jsonb) set schema private;
alter function public.app_admin_players(text) set schema private;
alter function public.app_admin_users(text) set schema private;
alter function public.app_admin_upsert_user(text,text,text,text,text) set schema private;
alter function public.app_admin_set_points(text,text,bigint) set schema private;
alter function public.app_admin_reset_password(text,text,text) set schema private;
alter function public.app_admin_delete_user(text,text) set schema private;
alter function public.app_admin_events(text,text,integer) set schema private;
alter function public.app_admin_stats(text) set schema private;

create function public.app_public_config() returns jsonb language sql stable security invoker set search_path='' as $$ select private.app_public_config() $$;
create function public.app_login(p_username text,p_password text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_login(p_username,p_password) $$;
create function public.app_resume(p_token uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_resume(p_token) $$;
create function public.app_logout(p_token uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_logout(p_token) $$;
create function public.app_state(p_token uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_state(p_token) $$;
create function public.app_save_state(p_token uuid,p_state jsonb) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_save_state(p_token,p_state) $$;
create function public.app_spin(p_token uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_spin(p_token) $$;
create function public.app_pick_box(p_token uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_pick_box(p_token) $$;
create function public.app_bet(p_token uuid,p_stake bigint) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_bet(p_token,p_stake) $$;
create function public.app_redeem(p_token uuid,p_prize text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_redeem(p_token,p_prize) $$;
create function public.app_cancel_redeem(p_token uuid,p_prize text,p_id text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_cancel_redeem(p_token,p_prize,p_id) $$;
create function public.app_claim_credits(p_token uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_claim_credits(p_token) $$;
create function public.app_change_password(p_username text,p_old_password text,p_new_password text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_change_password(p_username,p_old_password,p_new_password) $$;
create function public.app_leaderboard(p_token uuid,p_top integer,p_period text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_leaderboard(p_token,p_top,p_period) $$;
create function public.app_push_subscribe(p_token uuid,p_sub jsonb) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_push_subscribe(p_token,p_sub) $$;
create function public.app_admin_check(p_pin text) returns boolean language sql stable security invoker set search_path='' as $$ select private.app_admin_check(p_pin) $$;
create function public.app_admin_push_subscribe(p_pin text,p_sub jsonb) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_push_subscribe(p_pin,p_sub) $$;
create function public.app_admin_redemptions(p_pin text)
returns table(id text,username text,bar text,premio text,puntos bigint,delivered boolean,delivered_at timestamptz,cancelled boolean,cancelled_at timestamptz,created_at timestamptz)
language sql volatile security invoker set search_path='' as $$ select * from private.app_admin_redemptions(p_pin) $$;
create function public.app_admin_set_delivered(p_pin text,p_id text,p_delivered boolean) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_set_delivered(p_pin,p_id,p_delivered) $$;
create function public.app_admin_save_config(p_pin text,p_data jsonb) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_save_config(p_pin,p_data) $$;
create function public.app_admin_players(p_pin text) returns table(username text,points bigint) language sql volatile security invoker set search_path='' as $$ select * from private.app_admin_players(p_pin) $$;
create function public.app_admin_users(p_pin text) returns table(username text,nombre text,bar text) language sql volatile security invoker set search_path='' as $$ select * from private.app_admin_users(p_pin) $$;
create function public.app_admin_upsert_user(p_pin text,p_username text,p_password text,p_nombre text,p_bar text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_upsert_user(p_pin,p_username,p_password,p_nombre,p_bar) $$;
create function public.app_admin_set_points(p_pin text,p_username text,p_points bigint) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_set_points(p_pin,p_username,p_points) $$;
create function public.app_admin_reset_password(p_pin text,p_username text,p_new_password text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_reset_password(p_pin,p_username,p_new_password) $$;
create function public.app_admin_delete_user(p_pin text,p_username text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_delete_user(p_pin,p_username) $$;
create function public.app_admin_events(p_pin text,p_username text,p_limit integer) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_events(p_pin,p_username,p_limit) $$;
create function public.app_admin_stats(p_pin text) returns jsonb language sql volatile security invoker set search_path='' as $$ select private.app_admin_stats(p_pin) $$;

revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant execute on function public.app_public_config() to anon;
grant execute on function public.app_login(text,text) to anon;
grant execute on function public.app_resume(uuid) to anon;
grant execute on function public.app_logout(uuid) to anon;
grant execute on function public.app_state(uuid) to anon;
grant execute on function public.app_save_state(uuid,jsonb) to anon;
grant execute on function public.app_spin(uuid) to anon;
grant execute on function public.app_pick_box(uuid) to anon;
grant execute on function public.app_bet(uuid,bigint) to anon;
grant execute on function public.app_redeem(uuid,text) to anon;
grant execute on function public.app_cancel_redeem(uuid,text,text) to anon;
grant execute on function public.app_claim_credits(uuid) to anon;
grant execute on function public.app_change_password(text,text,text) to anon;
grant execute on function public.app_leaderboard(uuid,integer,text) to anon;
grant execute on function public.app_push_subscribe(uuid,jsonb) to anon;
grant execute on function public.app_demo_credit(integer) to anon;
grant execute on function public.app_admin_check(text) to anon;
grant execute on function public.app_admin_push_subscribe(text,jsonb) to anon;
grant execute on function public.app_admin_redemptions(text) to anon;
grant execute on function public.app_admin_set_delivered(text,text,boolean) to anon;
grant execute on function public.app_admin_save_config(text,jsonb) to anon;
grant execute on function public.app_admin_players(text) to anon;
grant execute on function public.app_admin_users(text) to anon;
grant execute on function public.app_admin_upsert_user(text,text,text,text,text) to anon;
grant execute on function public.app_admin_set_points(text,text,bigint) to anon;
grant execute on function public.app_admin_reset_password(text,text,text) to anon;
grant execute on function public.app_admin_delete_user(text,text) to anon;
grant execute on function public.app_admin_events(text,text,integer) to anon;
grant execute on function public.app_admin_stats(text) to anon;
grant execute on function public.app_push_targets(text,text[]) to service_role;
grant execute on function public.app_push_prune(text) to service_role;

notify pgrst, 'reload schema';
commit;
