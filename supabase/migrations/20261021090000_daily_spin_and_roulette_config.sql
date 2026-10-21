begin;

-- Roulette awards points without subtracting the selected level. Its average
-- multiplier may exceed x1; only the admin may configure it, within x1..x20.
drop trigger if exists validate_app_config on private.app_config;

-- Retain existing positive-prize settings and all unrelated configuration.
update private.app_config c
set data=jsonb_set(c.data,'{bet,segments}',
  coalesce((select jsonb_agg(s.value order by s.ordinality)
    from jsonb_array_elements(c.data#>'{bet,segments}') with ordinality s(value,ordinality)
    where (s.value->>'mult')::numeric between 1 and 20
      and (s.value->>'w')::numeric between 0 and 1000000
    having count(*)>=2 and sum((s.value->>'w')::numeric)>0),
    '[{"mult":1,"w":180},{"mult":1.5,"w":12},{"mult":2,"w":5},{"mult":3,"w":2},{"mult":5,"w":1}]'::jsonb),true),
  rev=greatest(c.rev+1,(extract(epoch from clock_timestamp())*1000)::bigint),updated_at=now()
where c.singleton;

create or replace function private.validate_app_config()
returns trigger language plpgsql security invoker set search_path=''
as $$
declare v_bet jsonb:=new.data->'bet'; v_seg jsonb; v_weight numeric; v_mult numeric; v_total numeric:=0;
begin
  if v_bet is null or jsonb_typeof(v_bet)<>'object'
     or v_bet->'segments' is null or jsonb_typeof(v_bet->'segments')<>'array'
     or jsonb_array_length(v_bet->'segments') not between 2 and 20 then
    raise exception using errcode='23514',message='invalid_bet_config';
  end if;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    begin v_weight:=(v_seg->>'w')::numeric; v_mult:=(v_seg->>'mult')::numeric;
    exception when others then raise exception using errcode='23514',message='invalid_bet_config'; end;
    if v_weight is null or v_mult is null or v_weight<0 or v_weight>1000000 or v_mult<1 or v_mult>20 then
      raise exception using errcode='23514',message='invalid_bet_config';
    end if;
    v_total:=v_total+v_weight;
  end loop;
  if v_total<=0 then raise exception using errcode='23514',message='invalid_bet_config'; end if;
  return new;
end $$;

create trigger validate_app_config before insert or update of data on private.app_config
for each row execute function private.validate_app_config();

-- The lock is per account, shared by every session and device.
create or replace function private.app_spin(p_token uuid)
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
  if not found then return jsonb_build_object('ok',false,'error','auth'); end if;
  if v_player.last_spin>=v_today then return jsonb_build_object('ok',false,'error','already','lastSpin',v_player.last_spin); end if;
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
    'lastSpin',v_today,'streak',v_player.streak,'pendingBox',v_player.streak=7,'betSpins',v_player.bet_spins,'betSpinsAward',v_award);
end $$;

create or replace function private.app_bet(p_token uuid, p_stake bigint)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_username text; v_player private.players%rowtype; v_bet jsonb; v_min bigint; v_max bigint; v_perday int;
  v_used int; v_total numeric:=0; v_weighted numeric:=0; v_pick numeric; v_acc numeric:=0; v_mult numeric:=0; v_seg jsonb;
  v_gain bigint; v_after bigint; v_bar text; v_folio text;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  select data->'bet' into v_bet from private.app_config where singleton;
  if coalesce((v_bet->>'enabled')::boolean,true)=false then return jsonb_build_object('ok',false,'error','disabled'); end if;
  v_min:=greatest(1,coalesce((v_bet->>'min')::bigint,100)); v_max:=greatest(v_min,coalesce((v_bet->>'max')::bigint,1000));
  v_perday:=greatest(1,coalesce((v_bet->>'perDay')::int,3));
  if p_stake is null or p_stake<v_min or p_stake>v_max then return jsonb_build_object('ok',false,'error','stake'); end if;
  select * into v_player from private.players where username=v_username for update;
  select count(*) into v_used from private.events where username=v_username and type='bet'
    and (created_at at time zone 'Europe/Madrid')::date=private.today_madrid();
  if v_player.bet_spins<=0 or v_used>=v_perday then return jsonb_build_object('ok',false,'error','limit'); end if;
  if jsonb_typeof(v_bet->'segments')<>'array' or jsonb_array_length(v_bet->'segments') not between 2 and 20 then
    return jsonb_build_object('ok',false,'error','odds');
  end if;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    if coalesce((v_seg->>'w')::numeric,0)>=0 and (v_seg->>'w') is not null and (v_seg->>'mult') is not null and (v_seg->>'mult')::numeric between 1 and 20 then
      v_total:=v_total+(v_seg->>'w')::numeric;
      v_weighted:=v_weighted+(v_seg->>'w')::numeric*(v_seg->>'mult')::numeric;
    else return jsonb_build_object('ok',false,'error','odds'); end if;
  end loop;
  if v_total<=0 then return jsonb_build_object('ok',false,'error','odds'); end if;
  v_pick:=random()*v_total;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    v_acc:=v_acc+(v_seg->>'w')::numeric;
    if v_pick<v_acc then v_mult:=(v_seg->>'mult')::numeric; exit; end if;
  end loop;
  v_gain:=greatest(1,floor(p_stake*v_mult)::bigint); v_after:=v_player.points+v_gain;
  update private.players set points=v_after,bet_spins=bet_spins-1,updated_at=now()
   where username=v_username returning bet_spins into v_player.bet_spins;
  select bar into v_bar from private.app_users where username=v_username;
  v_folio:=upper(substr(replace(extensions.gen_random_uuid()::text,'-',''),1,12));
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'bet','Ruleta +'||v_gain::text,v_gain,
    jsonb_build_object('game','ruleta','level',p_stake,'mult',v_mult,'gain',v_gain,'before',v_after-v_gain,'after',v_after,'folio',v_folio));
  return jsonb_build_object('ok',true,'mult',v_mult,'gain',v_gain,'points',v_after,'betSpins',v_player.bet_spins);
end $$;

notify pgrst, 'reload schema';
commit;
