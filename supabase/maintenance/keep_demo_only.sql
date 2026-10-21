-- One-off maintenance, only after the owner authorizes keeping demo alone.
-- Deactivation preserves players, points, redemptions and revenue history.
begin;
do $$
begin
  if not exists(select 1 from private.app_users where username='demo' and active) then
    raise exception 'Active demo account missing; no users changed';
  end if;
end $$;
update private.app_users set active=false,updated_at=now()
where username<>'demo' and active;
update private.sessions set expires_at=least(expires_at,now())
where username<>'demo' and expires_at>now();
commit;
select username,active from private.app_users order by username;
