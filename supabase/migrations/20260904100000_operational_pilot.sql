begin;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Manual revenue is the current source. external_id/source make a later
-- machine connector idempotent without changing the points ledger contract.
alter table private.revenue_credits
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text;

alter table private.revenue_credits drop constraint if exists revenue_credits_source_check;
alter table private.revenue_credits add constraint revenue_credits_source_check
  check (source in ('manual','external'));
create unique index if not exists revenue_credits_external_id_uidx
  on private.revenue_credits(external_id) where external_id is not null;

create or replace function private.app_admin_add_revenue(
  p_pin text, p_id text, p_username text, p_eur numeric, p_days integer,
  p_points bigint, p_base_points bigint, p_bonus_points bigint,
  p_reference_daily numeric, p_concept text, p_credit_date date default current_date
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_username text:=lower(trim(p_username)); v_id text:=trim(p_id); v_row private.revenue_credits%rowtype;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if v_id is null or length(v_id) not between 1 and 120
     or not exists(select 1 from private.app_users where username=v_username and active)
     or p_eur is null or p_eur<=0 or p_eur>100000000
     or p_days is null or p_days not between 1 and 3660
     or p_points is null or p_points<0 or p_points>100000000 then
    return jsonb_build_object('ok',false,'error','input');
  end if;
  insert into private.revenue_credits(id,username,eur,days,points,base_points,bonus_points,reference_daily,concept,credit_date,source)
  values(v_id,v_username,p_eur,p_days,p_points,greatest(0,coalesce(p_base_points,0)),greatest(0,coalesce(p_bonus_points,0)),
    p_reference_daily,left(coalesce(p_concept,''),240),coalesce(p_credit_date,private.today_madrid()),'manual')
  on conflict(id) do nothing returning * into v_row;
  if not found then return jsonb_build_object('ok',false,'error','duplicate'); end if;
  return jsonb_build_object('ok',true,'credit',to_jsonb(v_row));
end $$;

create or replace function private.app_admin_delete_revenue(p_pin text,p_id text)
returns jsonb language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  delete from private.revenue_credits where id=p_id and source='manual' and claimed_at is null;
  return jsonb_build_object('ok',found);
end $$;

create or replace function public.app_admin_add_revenue(
  p_pin text, p_id text, p_username text, p_eur numeric, p_days integer,
  p_points bigint, p_base_points bigint, p_bonus_points bigint,
  p_reference_daily numeric, p_concept text, p_credit_date date default current_date
)
returns jsonb language sql volatile security invoker set search_path=''
as $$ select private.app_admin_add_revenue(p_pin,p_id,p_username,p_eur,p_days,p_points,p_base_points,p_bonus_points,p_reference_daily,p_concept,p_credit_date) $$;

create or replace function public.app_admin_delete_revenue(p_pin text,p_id text)
returns jsonb language sql volatile security invoker set search_path=''
as $$ select private.app_admin_delete_revenue(p_pin,p_id) $$;

revoke all on function public.app_admin_add_revenue(text,text,text,numeric,integer,bigint,bigint,bigint,numeric,text,date) from public,authenticated;
revoke all on function public.app_admin_delete_revenue(text,text) from public,authenticated;
grant execute on function public.app_admin_add_revenue(text,text,text,numeric,integer,bigint,bigint,bigint,numeric,text,date) to anon;
grant execute on function public.app_admin_delete_revenue(text,text) to anon;

-- A roulette play always awards points. The selected amount only scales the
-- prize; it is never deducted from the player's balance.
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
    if coalesce((v_seg->>'w')::numeric,0)>0 and coalesce((v_seg->>'mult')::numeric,0) between 0 and 20 then
      v_total:=v_total+(v_seg->>'w')::numeric;
      v_weighted:=v_weighted+(v_seg->>'w')::numeric*(v_seg->>'mult')::numeric;
    else return jsonb_build_object('ok',false,'error','odds'); end if;
  end loop;
  if v_total<=0 or v_weighted/v_total>1 then return jsonb_build_object('ok',false,'error','odds'); end if;
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

create table if not exists private.push_dispatches (
  kind text not null,
  local_date date not null,
  requested_at timestamptz not null default now(),
  request_id bigint,
  primary key(kind,local_date)
);

create or replace function private.push_request(p_action text,p_body jsonb)
returns bigint language plpgsql security definer set search_path=''
as $$
declare v_secret text; v_request bigint;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='tikitaka_push_secret';
  if coalesce(v_secret,'')='' then raise exception 'missing_push_secret'; end if;
  select net.http_post(
    url:='https://bxyjassnjcyegqnimdsq.supabase.co/functions/v1/push?action='||p_action,
    headers:=jsonb_build_object('Content-Type','application/json','x-push-secret',v_secret),
    body:=coalesce(p_body,'{}'::jsonb), timeout_milliseconds:=10000
  ) into v_request;
  return v_request;
end $$;

create or replace function private.dispatch_daily_push()
returns bigint language plpgsql security definer set search_path=''
as $$
declare v_date date:=(now() at time zone 'Europe/Madrid')::date; v_request bigint;
begin
  if extract(hour from now() at time zone 'Europe/Madrid')::int<>11 then return null; end if;
  insert into private.push_dispatches(kind,local_date) values('daily',v_date) on conflict do nothing;
  if not found then return null; end if;
  v_request:=private.push_request('daily',jsonb_build_object('action','daily','date',v_date));
  update private.push_dispatches set request_id=v_request where kind='daily' and local_date=v_date;
  return v_request;
end $$;

create or replace function private.notify_redemption_push()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  perform private.push_request('canje',jsonb_build_object('action','canje','record',to_jsonb(new)));
  return new;
end $$;

drop trigger if exists notify_redemption_push on private.redemptions;
create trigger notify_redemption_push after insert on private.redemptions
for each row execute function private.notify_redemption_push();

select cron.schedule('tikitaka-daily-push','5 * * * *','select private.dispatch_daily_push()');

create or replace function private.app_admin_stats(p_pin text)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_out jsonb;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  select jsonb_build_object(
    'ok',true,
    'players_total',(select count(*) from private.app_users where active and not is_builtin),
    'players_active7',(select count(*) from private.players p join private.app_users u using(username) where u.active and not u.is_builtin and p.last_seen_at>=now()-interval '7 days'),
    'players_active30',(select count(*) from private.players p join private.app_users u using(username) where u.active and not u.is_builtin and p.last_seen_at>=now()-interval '30 days'),
    'points_held',(select coalesce(sum(p.points),0) from private.players p join private.app_users u using(username) where u.active and not u.is_builtin),
    'points_earned30',(select coalesce(sum(greatest(delta,0)),0) from private.events where created_at>=now()-interval '30 days'),
    'points_redeemed',(select coalesce(sum(puntos),0) from private.redemptions where not cancelled),
    'revenue_total',(select coalesce(sum(eur),0) from private.revenue_credits),
    'revenue_30',(select coalesce(sum(eur),0) from private.revenue_credits where credit_date>=private.today_madrid()-29),
    'spins_total',(select count(*) from private.events where type='spin'),
    'spins_today',(select count(*) from private.events where type='spin' and (created_at at time zone 'Europe/Madrid')::date=private.today_madrid()),
    'bets_count',(select count(*) from private.events where type='bet'),
    'bets_delta',(select coalesce(sum(delta),0) from private.events where type='bet'),
    'redeem_total',(select count(*) from private.redemptions where not cancelled),
    'redeem_pending',(select count(*) from private.redemptions where not delivered and not cancelled),
    'push_users',(select count(*) from private.push_subscriptions where not is_admin),
    'daily',(select coalesce(jsonb_agg(jsonb_build_object('d',d,'spins',spins) order by d),'[]'::jsonb) from (
       select gs::date d,count(e.id) spins from generate_series(private.today_madrid()-13,private.today_madrid(),interval '1 day') gs
       left join private.events e on e.type='spin' and (e.created_at at time zone 'Europe/Madrid')::date=gs::date group by gs::date) q),
    'top_prizes',(select coalesce(jsonb_agg(jsonb_build_object('name',premio,'n',n) order by n desc),'[]'::jsonb) from (select premio,count(*) n from private.redemptions where not cancelled group by premio order by n desc limit 5) q),
    'top_players',(select coalesce(jsonb_agg(jsonb_build_object('username',q.username,'bar',q.bar,'points',q.points) order by q.points desc),'[]'::jsonb)
      from (select p.username,u.bar,p.points from private.players p join private.app_users u using(username) where u.active and not u.is_builtin order by p.points desc limit 5) q),
    'revenue_by_bar',(select coalesce(jsonb_agg(jsonb_build_object('username',q.username,'bar',q.bar,'eur',q.eur,'points',q.points) order by q.eur desc),'[]'::jsonb)
      from (select r.username,max(u.bar) bar,sum(r.eur) eur,sum(r.points) points from private.revenue_credits r join private.app_users u using(username) group by r.username order by sum(r.eur) desc limit 20) q),
    'ts',now()
  ) into v_out;
  return v_out;
end $$;

revoke all on function private.push_request(text,jsonb), private.dispatch_daily_push(), private.notify_redemption_push() from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;
