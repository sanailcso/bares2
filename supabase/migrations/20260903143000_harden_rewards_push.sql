begin;

-- La tirada gratuita aporta 22,2 puntos de media. La ruleta devuelve un
-- 94,75 % de lo apostado de media y siempre se valida en el servidor.
update private.app_config
set data = jsonb_set(
      data,
      '{bet}',
      '{"enabled":true,"min":100,"max":1000,"perDay":3,"segments":[{"mult":0,"w":15},{"mult":0.5,"w":45},{"mult":1,"w":110},{"mult":1.5,"w":18},{"mult":2,"w":8},{"mult":3,"w":3},{"mult":5,"w":1}]}'::jsonb,
      true
    ),
    rev = greatest(rev + 1, (extract(epoch from clock_timestamp()) * 1000)::bigint),
    updated_at = now()
where singleton;

create or replace function public.app_spin(p_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_username text; v_player private.players%rowtype; v_today date:=private.today_madrid();
  v_tier int; v_bonus int:=0; v_award int; v_before bigint; v_after bigint; v_roll double precision;
  v_symbols jsonb; v_bar text; v_folio text;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  select * into v_player from private.players where username=v_username for update;
  if v_player.last_spin=v_today then return jsonb_build_object('ok',false,'error','already'); end if;
  v_before:=v_player.points;
  v_roll:=random();
  if v_roll<0.01 then v_tier:=120; v_symbols:='["J","J","J","J","J"]'::jsonb;
  elsif v_roll<0.04 then v_tier:=60; v_symbols:='["P","P","P","P","P"]'::jsonb;
  else v_tier:=20; v_symbols:=jsonb_build_array(floor(random()*4)::int,floor(random()*4)::int,floor(random()*4)::int,floor(random()*4)::int,floor(random()*4)::int); end if;
  if v_player.last_spin=v_today-1 and v_player.streak between 1 and 6 then
    v_player.streak:=v_player.streak+1;
  else v_player.streak:=1; end if;
  if v_player.streak in (3,6) then v_bonus:=35; end if;
  v_award:=1+floor(random()*3)::int;
  v_after:=v_before+v_tier+v_bonus;
  update private.players set points=v_after,streak=v_player.streak,last_spin=v_today,
    pending_box=(v_player.streak=7),bet_spins=bet_spins+v_award,last_seen_at=now(),updated_at=now()
   where username=v_username returning bet_spins into v_player.bet_spins;
  select bar into v_bar from private.app_users where username=v_username;
  v_folio:=upper(substr(replace(extensions.gen_random_uuid()::text,'-',''),1,12));
  insert into private.events(username,bar,type,label,delta,meta) values(
    v_username,v_bar,'spin',case when v_tier=120 then '¡JACKPOT! Tirada diaria' when v_tier=60 then '¡Triple! Tirada diaria' else 'Tirada diaria' end,
    v_tier+v_bonus,jsonb_build_object('game','rodillos','result',v_tier,'bonus',v_bonus,'before',v_before,'after',v_after,'symbols',v_symbols,'box',v_player.streak=7,'folio',v_folio));
  return jsonb_build_object('ok',true,'tier',v_tier,'symbols',v_symbols,'points',v_after,
    'streak',v_player.streak,'pendingBox',v_player.streak=7,'betSpins',v_player.bet_spins,'betSpinsAward',v_award);
end $$;

create or replace function public.app_bet(p_token uuid, p_stake bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_username text; v_player private.players%rowtype; v_bet jsonb; v_min bigint; v_max bigint; v_perday int;
  v_used int; v_total numeric:=0; v_weighted numeric:=0; v_pick numeric; v_acc numeric:=0; v_mult numeric:=0; v_seg jsonb;
  v_return bigint; v_after bigint; v_bar text; v_folio text;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  select data->'bet' into v_bet from private.app_config where singleton;
  if coalesce((v_bet->>'enabled')::boolean,true)=false then return jsonb_build_object('ok',false,'error','disabled'); end if;
  v_min:=greatest(1,coalesce((v_bet->>'min')::bigint,100)); v_max:=greatest(v_min,coalesce((v_bet->>'max')::bigint,1000));
  v_perday:=greatest(1,coalesce((v_bet->>'perDay')::int,3));
  if p_stake is null or p_stake<v_min or p_stake>v_max then return jsonb_build_object('ok',false,'error','stake'); end if;
  select * into v_player from private.players where username=v_username for update;
  if v_player.points<p_stake then return jsonb_build_object('ok',false,'error','funds'); end if;
  select count(*) into v_used from private.events where username=v_username and type='bet'
    and (created_at at time zone 'Europe/Madrid')::date=private.today_madrid();
  if v_player.bet_spins<=0 or v_used>=v_perday then return jsonb_build_object('ok',false,'error','limit'); end if;
  if jsonb_typeof(v_bet->'segments')<>'array' or jsonb_array_length(v_bet->'segments') not between 2 and 20 then
    return jsonb_build_object('ok',false,'error','odds');
  end if;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    if coalesce((v_seg->>'w')::numeric,0)>0 and coalesce((v_seg->>'mult')::numeric,0) between 0 and 20 then
      v_total:=v_total+(v_seg->>'w')::numeric;
      v_weighted:=v_weighted+(v_seg->>'w')::numeric*(v_seg->>'mult')::numeric;
    else
      return jsonb_build_object('ok',false,'error','odds');
    end if;
  end loop;
  if v_total<=0 or v_weighted/v_total>1 then return jsonb_build_object('ok',false,'error','odds'); end if;
  v_pick:=random()*v_total;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    v_acc:=v_acc+(v_seg->>'w')::numeric;
    if v_pick<v_acc then v_mult:=(v_seg->>'mult')::numeric; exit; end if;
  end loop;
  v_return:=floor(p_stake*v_mult)::bigint; v_after:=v_player.points-p_stake+v_return;
  update private.players set points=v_after,bet_spins=bet_spins-1,updated_at=now()
   where username=v_username returning bet_spins into v_player.bet_spins;
  select bar into v_bar from private.app_users where username=v_username;
  v_folio:=upper(substr(replace(extensions.gen_random_uuid()::text,'-',''),1,12));
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'bet','Ruleta x'||v_mult::text,v_after-v_player.points,
    jsonb_build_object('game','ruleta','stake',p_stake,'mult',v_mult,'ret',v_return,'before',v_player.points,'after',v_after,'folio',v_folio));
  return jsonb_build_object('ok',true,'mult',v_mult,'points',v_after,'betSpins',v_player.bet_spins);
end $$;

-- API interna de la Edge Function. No se expone a anon/authenticated.
create or replace function public.app_push_targets(p_kind text, p_usernames text[])
returns table(sub jsonb) language sql stable security definer set search_path = ''
as $$
  select s.subscription as sub
  from private.push_subscriptions s
  where case p_kind
    when 'admin' then s.is_admin
    when 'daily' then not s.is_admin and s.username is not null and exists (
      select 1 from private.players p
      where p.username=s.username and (p.last_spin is null or p.last_spin<private.today_madrid())
    )
    when 'users' then not s.is_admin and s.username is not null
      and (p_usernames is null or s.username=any(p_usernames))
    else false
  end
$$;

create or replace function public.app_push_prune(p_endpoint text)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if p_endpoint is null or length(p_endpoint)>2048 then return false; end if;
  delete from private.push_subscriptions where endpoint=p_endpoint;
  return found;
end $$;

revoke execute on function public.app_push_targets(text,text[]) from public, anon, authenticated;
revoke execute on function public.app_push_prune(text) from public, anon, authenticated;
grant execute on function public.app_push_targets(text,text[]) to service_role;
grant execute on function public.app_push_prune(text) to service_role;

notify pgrst, 'reload schema';
commit;
