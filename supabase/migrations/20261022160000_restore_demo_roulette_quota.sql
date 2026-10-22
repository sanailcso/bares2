begin;

-- Debit the stake and credit the payout atomically under the account row lock.
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
  if not found then return jsonb_build_object('ok',false,'error','auth'); end if;
  if v_player.points<p_stake then return jsonb_build_object('ok',false,'error','funds','points',v_player.points); end if;
  select count(*) into v_used from private.events where username=v_username and type='bet'
    and (created_at at time zone 'Europe/Madrid')::date=private.today_madrid();
  if v_player.bet_spins<=0 then return jsonb_build_object('ok',false,'error','limit','betSpins',0); end if;
  if v_username<>'demo' and v_used>=v_perday then
    return jsonb_build_object('ok',false,'error','daily_limit','betSpins',v_player.bet_spins,'betsToday',v_used,'perDay',v_perday);
  end if;
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
  v_gain:=greatest(1,floor(p_stake*v_mult)::bigint); v_after:=v_player.points-p_stake+v_gain;
  update private.players set points=v_after,bet_spins=bet_spins-1,updated_at=now()
   where username=v_username returning bet_spins into v_player.bet_spins;
  select bar into v_bar from private.app_users where username=v_username;
  v_folio:=upper(substr(replace(extensions.gen_random_uuid()::text,'-',''),1,12));
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'bet','Ruleta: apuesta '||p_stake::text||', premio '||v_gain::text,v_gain-p_stake,
    jsonb_build_object('game','ruleta','level',p_stake,'stake',p_stake,'afterStake',v_player.points-p_stake,'mult',v_mult,'gain',v_gain,'before',v_player.points,'after',v_after,'folio',v_folio));
  return jsonb_build_object('ok',true,'mult',v_mult,'gain',v_gain,'stake',p_stake,'before',v_player.points,'afterStake',v_player.points-p_stake,'points',v_after,'betSpins',v_player.bet_spins);
end $$;


notify pgrst, 'reload schema';
commit;
