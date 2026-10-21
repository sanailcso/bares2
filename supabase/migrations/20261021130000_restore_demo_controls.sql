begin;

-- The token, never a username supplied by the browser, identifies the demo.
create or replace function public.app_demo_action(p_token uuid, p_action text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_username text; v_player private.players%rowtype; v_delta bigint:=0;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  if v_username<>'demo' then return jsonb_build_object('ok',false,'error','demo_only'); end if;
  if p_action is null or p_action not in ('day','points','streak','box','golden','roulette','reset') then
    return jsonb_build_object('ok',false,'error','action');
  end if;
  select * into v_player from private.players where username=v_username for update;
  if not found then return jsonb_build_object('ok',false,'error','auth'); end if;
  if p_action='day' then v_player.last_spin:=private.today_madrid()-1;
  elsif p_action='points' then v_delta:=20000; v_player.points:=v_player.points+v_delta;
  elsif p_action='streak' then
    v_player.streak:=case when v_player.streak>=7 then 1 else v_player.streak+1 end;
    v_player.last_spin:=private.today_madrid();
    if v_player.streak in (3,6) then v_delta:=35; v_player.points:=v_player.points+v_delta; end if;
    if v_player.streak=7 then v_player.pending_box:=true; end if;
  elsif p_action='box' then v_player.pending_box:=true;
  elsif p_action='golden' then
    v_player.client_state:=v_player.client_state||'{"goldenRound":true}'::jsonb;
    v_player.bet_spins:=v_player.bet_spins+1;
  elsif p_action='roulette' then v_player.bet_spins:=v_player.bet_spins+3;
  elsif p_action='reset' then
    v_delta:=-v_player.points;
    v_player.points:=0; v_player.streak:=0; v_player.last_spin:=null;
    v_player.pending_box:=false; v_player.bet_spins:=0; v_player.client_state:='{}'::jsonb;
  end if;
  update private.players set points=v_player.points,streak=v_player.streak,last_spin=v_player.last_spin,
    pending_box=v_player.pending_box,bet_spins=v_player.bet_spins,
    client_state=v_player.client_state||'{"dayOffset":0}'::jsonb,updated_at=now()
    where username=v_username;
  insert into private.events(username,type,label,delta,meta)
    values(v_username,'demo','Prueba demo: '||p_action,v_delta,jsonb_build_object('action',p_action));
  return jsonb_build_object('ok',true,'state',private.player_state(v_username));
end $$;

revoke all on function public.app_demo_action(uuid,text) from public,anon,authenticated;
grant execute on function public.app_demo_action(uuid,text) to anon;

-- The existing roulette implementation is retained below; only the demo
-- account may use its earned test spins after the normal daily quota.

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
  if v_player.bet_spins<=0 or (v_username<>'demo' and v_used>=v_perday) then return jsonb_build_object('ok',false,'error','limit'); end if;
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
