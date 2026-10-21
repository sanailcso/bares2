begin;
-- Removing a client disables access while retaining accounting and game history.
create or replace function private.app_admin_delete_user(p_pin text,p_username text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_username text:=lower(trim(p_username));
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if v_username='demo' then return jsonb_build_object('ok',false,'error','builtin'); end if;
  update private.app_users set active=false,updated_at=now() where username=v_username;
  if not found then return jsonb_build_object('ok',false,'error','nouser'); end if;
  update private.sessions set expires_at=least(expires_at,now()) where username=v_username and expires_at>now();
  return jsonb_build_object('ok',true);
end $$;
notify pgrst,'reload schema';
commit;
