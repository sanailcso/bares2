-- Tiki Taka Bares: canonical backend reconstructed from the frontend RPC contract.
-- Internal data lives outside the exposed `public` schema. The only browser
-- entry points are the explicitly granted RPC functions at the end of this file.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.app_users (
  username text primary key check (username ~ '^[a-z0-9_.-]{2,40}$'),
  pass_hash text not null,
  nombre text not null check (length(nombre) between 1 and 120),
  bar text not null check (length(bar) between 1 and 160),
  active boolean not null default true,
  is_builtin boolean not null default false,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.players (
  username text primary key references private.app_users(username) on delete cascade,
  points bigint not null default 0 check (points >= 0),
  streak integer not null default 0 check (streak between 0 and 7),
  last_spin date,
  pending_box boolean not null default false,
  bet_spins integer not null default 0 check (bet_spins >= 0),
  client_state jsonb not null default '{}'::jsonb check (jsonb_typeof(client_state) = 'object'),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.sessions (
  token uuid primary key default extensions.gen_random_uuid(),
  username text not null references private.app_users(username) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index sessions_username_idx on private.sessions(username);
create index sessions_expires_idx on private.sessions(expires_at);

create table private.app_config (
  singleton boolean primary key default true check (singleton),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  rev bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table private.revenue_credits (
  id text primary key check (length(id) between 1 and 120),
  username text not null,
  eur numeric(14,2) not null default 0 check (eur >= 0),
  days integer not null default 0 check (days >= 0),
  points bigint not null check (points >= 0),
  base_points bigint not null default 0,
  bonus_points bigint not null default 0,
  reference_daily numeric,
  concept text not null default '',
  credit_date date not null default current_date,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index revenue_credits_claim_idx on private.revenue_credits(username, claimed_at);

create table private.redemptions (
  id uuid primary key default extensions.gen_random_uuid(),
  username text not null,
  bar text not null,
  premio text not null,
  puntos bigint not null check (puntos > 0),
  delivered boolean not null default false,
  delivered_at timestamptz,
  cancelled boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index redemptions_user_idx on private.redemptions(username, created_at desc);
create index redemptions_pending_idx on private.redemptions(delivered, cancelled, created_at desc);

create table private.events (
  id bigint generated always as identity primary key,
  username text not null,
  bar text,
  type text not null check (length(type) between 1 and 40),
  label text not null default '',
  delta bigint not null default 0,
  meta jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object'),
  created_at timestamptz not null default now()
);
create index events_user_created_idx on private.events(username, created_at desc);
create index events_type_created_idx on private.events(type, created_at desc);

create table private.push_subscriptions (
  endpoint text primary key,
  username text,
  is_admin boolean not null default false,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);

create table private.admin_settings (
  singleton boolean primary key default true check (singleton),
  pin_hash text,
  updated_at timestamptz not null default now()
);

alter table private.app_users enable row level security;
alter table private.players enable row level security;
alter table private.sessions enable row level security;
alter table private.app_config enable row level security;
alter table private.revenue_credits enable row level security;
alter table private.redemptions enable row level security;
alter table private.events enable row level security;
alter table private.push_subscriptions enable row level security;
alter table private.admin_settings enable row level security;

create policy deny_direct_access on private.app_users as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.players as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.sessions as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.app_config as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.revenue_credits as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.redemptions as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.events as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.push_subscriptions as restrictive for all to anon, authenticated using (false) with check (false);
create policy deny_direct_access on private.admin_settings as restrictive for all to anon, authenticated using (false) with check (false);

revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all sequences in schema private from public, anon, authenticated;

create or replace function private.today_madrid()
returns date language sql stable set search_path = ''
as $$ select (now() at time zone 'Europe/Madrid')::date $$;

create or replace function private.session_username(p_token uuid)
returns text language sql volatile security definer set search_path = ''
as $$
  update private.sessions s
     set last_used_at = now()
   where s.token = p_token and s.expires_at > now()
  returning s.username
$$;

create or replace function private.is_admin(p_pin text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(length(p_pin) >= 8 and a.pin_hash = extensions.crypt(p_pin, a.pin_hash), false)
  from private.admin_settings a where a.singleton
$$;

create or replace function private.player_state(p_username text)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select coalesce(p.client_state, '{}'::jsonb) || jsonb_build_object(
    'points', p.points,
    'streak', p.streak,
    'lastSpin', p.last_spin,
    'pendingBox', p.pending_box,
    'betSpins', p.bet_spins,
    'bets', jsonb_build_object(
      'date', private.today_madrid(),
      'count', (select count(*) from private.events e
                where e.username=p.username and e.type='bet'
                  and (e.created_at at time zone 'Europe/Madrid')::date=private.today_madrid())
    )
  )
  from private.players p where p.username=p_username
$$;

revoke execute on all functions in schema private from public, anon, authenticated;

insert into private.app_config(singleton, data, rev) values (
  true,
  $json${
    "logo":"./icons/icon-192.png",
    "themes":[
      {"id":"default","name":"Clásico","img":"./img/bg-default.png","sym":{"jackpot":"🍒","prize":"💎","fillers":["⚽","👟","🥅","🎯"]}},
      {"id":"halloween","name":"Halloween","img":"./img/bg-halloween.png","sym":{"jackpot":"🎃","prize":"👻","fillers":["🦇","🕷️","🍬","🕯️"]}},
      {"id":"navidad","name":"Navidad","img":"./img/bg-navidad.png","sym":{"jackpot":"🎄","prize":"🎁","fillers":["🎅","🔔","⛄","🍬"]}}
    ],
    "schedule":[
      {"themeId":"halloween","from":{"m":10,"d":15},"to":{"m":10,"d":31}},
      {"themeId":"navidad","from":{"m":12,"d":1},"to":{"m":1,"d":6}}
    ],
    "fallback":"default",
    "override":null,
    "pointsPer100":300,
    "growthPerEur":15,
    "growthByBar":{},
    "bet":{"enabled":true,"min":100,"max":1000,"perDay":3,"segments":[{"mult":0,"w":15},{"mult":0.5,"w":45},{"mult":1,"w":110},{"mult":1.5,"w":18},{"mult":2,"w":8},{"mult":3,"w":3},{"mult":5,"w":1}]},
    "rewards":[
      {"name":"Llavero premium","emoji":"🔑","cost":2500,"tier":"Regalos"},
      {"name":"Gorra Tiki Taka","emoji":"🧢","cost":3500,"tier":"Regalos"},
      {"name":"Set de copas de bar","emoji":"🥃","cost":5500,"tier":"Regalos"},
      {"name":"Mochila de viaje","emoji":"🎒","cost":8000,"tier":"Regalos"},
      {"name":"Auriculares inalámbricos","emoji":"🎧","cost":16000,"tier":"Electrónica"},
      {"name":"Altavoz Bluetooth","emoji":"🔊","cost":24000,"tier":"Electrónica"},
      {"name":"Tablet de 10 pulgadas","emoji":"📱","cost":38000,"tier":"Electrónica"},
      {"name":"Smart TV de 50 pulgadas","emoji":"📺","cost":55000,"tier":"Electrónica"},
      {"name":"Escapada rural (2 noches)","emoji":"🏞️","cost":65000,"tier":"Viajes"},
      {"name":"Fin de semana en la nieve","emoji":"🎿","cost":90000,"tier":"Viajes"},
      {"name":"Crucero por el Mediterráneo","emoji":"🛳️","cost":140000,"tier":"Viajes"}
    ]
  }$json$::jsonb,
  1
);
insert into private.admin_settings(singleton) values (true);
insert into private.app_users(username, pass_hash, nombre, bar, is_builtin)
values ('demo', extensions.crypt('demo', extensions.gen_salt('bf', 12)), 'Bar Demo', 'Bar Demo', true);
insert into private.players(username) values ('demo');

create or replace function public.app_public_config()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select (c.data - 'users' - 'credits') || jsonb_build_object('rev', c.rev)
  from private.app_config c where c.singleton
$$;

create or replace function public.app_login(p_username text, p_password text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user private.app_users%rowtype;
  v_token uuid;
begin
  if p_username is null or p_password is null or length(p_password)>256 then
    return jsonb_build_object('ok',false,'error','credentials');
  end if;
  select * into v_user from private.app_users
   where username=lower(trim(p_username)) for update;
  if not found or not v_user.active then
    return jsonb_build_object('ok',false,'error','credentials');
  end if;
  if v_user.locked_until is not null and v_user.locked_until>now() then
    return jsonb_build_object('ok',false,'error','locked');
  end if;
  if v_user.pass_hash <> extensions.crypt(p_password, v_user.pass_hash) then
    update private.app_users set
      failed_attempts=failed_attempts+1,
      locked_until=case when failed_attempts+1>=5 then now()+interval '15 minutes' else null end,
      updated_at=now()
    where username=v_user.username;
    return jsonb_build_object('ok',false,'error','credentials');
  end if;
  update private.app_users set failed_attempts=0, locked_until=null, updated_at=now()
   where username=v_user.username;
  insert into private.players(username) values(v_user.username) on conflict do nothing;
  delete from private.sessions where expires_at<=now();
  insert into private.sessions(username) values(v_user.username) returning token into v_token;
  update private.players set last_seen_at=now(),updated_at=now() where username=v_user.username;
  return jsonb_build_object('ok',true,'token',v_token,'nombre',v_user.nombre,'bar',v_user.bar,
                            'state',private.player_state(v_user.username));
end $$;

create or replace function public.app_resume(p_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_user private.app_users%rowtype;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','expired'); end if;
  select * into v_user from private.app_users where username=v_username and active;
  if not found then return jsonb_build_object('ok',false,'error','auth'); end if;
  update private.players set last_seen_at=now() where username=v_username;
  return jsonb_build_object('ok',true,'nombre',v_user.nombre,'bar',v_user.bar,
                            'state',private.player_state(v_username));
end $$;

create or replace function public.app_logout(p_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$ begin delete from private.sessions where token=p_token; return jsonb_build_object('ok',true); end $$;

create or replace function public.app_state(p_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_state jsonb;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  v_state:=private.player_state(v_username);
  return jsonb_build_object('ok',true,
    'points',(v_state->>'points')::bigint,'streak',(v_state->>'streak')::int,
    'lastSpin',v_state->'lastSpin','pendingBox',(v_state->>'pendingBox')::boolean,
    'betSpins',(v_state->>'betSpins')::int,'betsToday',(v_state#>>'{bets,count}')::int);
end $$;

create or replace function public.app_save_state(p_token uuid, p_state jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_safe jsonb;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  if p_state is null or jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>262144 then
    return jsonb_build_object('ok',false,'error','state');
  end if;
  v_safe:=p_state-'points'-'streak'-'lastSpin'-'pendingBox'-'betSpins'-'bets'-'appliedCredits';
  update private.players set client_state=v_safe,updated_at=now() where username=v_username;
  return jsonb_build_object('ok',true);
end $$;

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

create or replace function public.app_pick_box(p_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_player private.players%rowtype; v_value int; v_before bigint; v_bar text; v_folio text;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  select * into v_player from private.players where username=v_username for update;
  if not v_player.pending_box then return jsonb_build_object('ok',false,'error','nobox'); end if;
  v_value:=(array[70,90,110])[1+floor(random()*3)::int]; v_before:=v_player.points;
  update private.players set points=points+v_value,streak=0,pending_box=false,updated_at=now()
   where username=v_username returning points into v_player.points;
  select bar into v_bar from private.app_users where username=v_username;
  v_folio:=upper(substr(replace(extensions.gen_random_uuid()::text,'-',''),1,12));
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'box','Caja sorpresa',v_value,
    jsonb_build_object('game','caja','result',v_value,'before',v_before,'after',v_player.points,'folio',v_folio));
  return jsonb_build_object('ok',true,'value',v_value,'points',v_player.points);
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
  for v_seg in select value from jsonb_array_elements(coalesce(v_bet->'segments','[]'::jsonb)) loop
    if coalesce((v_seg->>'w')::numeric,0)>0 and coalesce((v_seg->>'mult')::numeric,0)>=0 then
      v_total:=v_total+(v_seg->>'w')::numeric;
      v_weighted:=v_weighted+(v_seg->>'w')::numeric*(v_seg->>'mult')::numeric;
    end if;
  end loop;
  if v_total<=0 then return jsonb_build_object('ok',false,'error','disabled'); end if;
  if v_weighted/v_total>1 then return jsonb_build_object('ok',false,'error','odds'); end if;
  v_pick:=random()*v_total;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    if coalesce((v_seg->>'w')::numeric,0)>0 then
      v_acc:=v_acc+(v_seg->>'w')::numeric;
      if v_pick<v_acc then v_mult:=greatest(0,(v_seg->>'mult')::numeric); exit; end if;
    end if;
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

create or replace function public.app_redeem(p_token uuid, p_prize text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_player private.players%rowtype; v_reward jsonb; v_cost bigint; v_bar text; v_id uuid; v_folio text;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  if p_prize is null or length(p_prize)>180 then return jsonb_build_object('ok',false,'error','noprize'); end if;
  select r.value into v_reward from private.app_config c,
    lateral jsonb_array_elements(coalesce(c.data->'rewards','[]'::jsonb)) r(value)
    where c.singleton and r.value->>'name'=p_prize and coalesce((r.value->>'enabled')::boolean,true) limit 1;
  if v_reward is null then return jsonb_build_object('ok',false,'error','noprize'); end if;
  v_cost:=coalesce((v_reward->>'cost')::bigint,0);
  if v_cost<=0 then return jsonb_build_object('ok',false,'error','noprize'); end if;
  select * into v_player from private.players where username=v_username for update;
  if v_player.points<v_cost then return jsonb_build_object('ok',false,'error','funds'); end if;
  select bar into v_bar from private.app_users where username=v_username;
  update private.players set points=points-v_cost,updated_at=now() where username=v_username returning points into v_player.points;
  insert into private.redemptions(username,bar,premio,puntos) values(v_username,v_bar,p_prize,v_cost) returning id into v_id;
  v_folio:=upper(substr(replace(v_id::text,'-',''),1,12));
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'redeem','Canje: '||p_prize,-v_cost,
    jsonb_build_object('before',v_player.points+v_cost,'after',v_player.points,'redemption_id',v_id,'folio',v_folio));
  return jsonb_build_object('ok',true,'points',v_player.points,'id',v_id);
end $$;

create or replace function public.app_cancel_redeem(p_token uuid, p_prize text, p_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_red private.redemptions%rowtype; v_points bigint; v_bar text; v_uuid uuid;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  begin v_uuid:=p_id::uuid; exception when invalid_text_representation then v_uuid:=null; end;
  select * into v_red from private.redemptions where username=v_username and id=v_uuid for update;
  if not found then
    select * into v_red from private.redemptions where username=v_username and premio=p_prize and not cancelled
      order by created_at desc limit 1 for update;
  end if;
  if not found then return jsonb_build_object('ok',false,'error','notfound'); end if;
  if v_red.delivered then return jsonb_build_object('ok',false,'error','delivered'); end if;
  if v_red.cancelled then return jsonb_build_object('ok',true,'points',(select points from private.players where username=v_username)); end if;
  update private.redemptions set cancelled=true,cancelled_at=now() where id=v_red.id;
  update private.players set points=points+v_red.puntos,updated_at=now() where username=v_username returning points into v_points;
  select bar into v_bar from private.app_users where username=v_username;
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'cancel','Canje cancelado: '||v_red.premio,v_red.puntos,
    jsonb_build_object('before',v_points-v_red.puntos,'after',v_points,'redemption_id',v_red.id,'folio',upper(substr(replace(v_red.id::text,'-',''),1,12))));
  return jsonb_build_object('ok',true,'points',v_points,'id',v_red.id);
end $$;

create or replace function public.app_claim_credits(p_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_points bigint; v_added bigint:=0; v_claimed jsonb:='[]'::jsonb;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  perform 1 from private.players where username=v_username for update;
  with claimed as (
    update private.revenue_credits set claimed_at=now()
     where username=v_username and claimed_at is null
     returning id,credit_date,concept,points
  ) select coalesce(sum(points),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'date',credit_date,'concept',concept,'pts',points)),'[]'::jsonb)
    into v_added,v_claimed from claimed;
  if v_added>0 then
    update private.players set points=points+v_added,updated_at=now() where username=v_username returning points into v_points;
    insert into private.events(username,bar,type,label,delta,meta)
      select v_username,u.bar,'revenue','Recaudación de máquinas',v_added,jsonb_build_object('before',v_points-v_added,'after',v_points,'credits',v_claimed)
      from private.app_users u where u.username=v_username;
  else select points into v_points from private.players where username=v_username; end if;
  return jsonb_build_object('ok',true,'points',v_points,'added',v_added,'claimed',v_claimed);
end $$;

create or replace function public.app_change_password(p_username text, p_old_password text, p_new_password text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user private.app_users%rowtype;
begin
  if p_old_password is null then return jsonb_build_object('ok',false,'error','password'); end if;
  if length(coalesce(p_new_password,''))<8 or length(coalesce(p_new_password,''))>128 then return jsonb_build_object('ok',false,'error','weak'); end if;
  select * into v_user from private.app_users where username=lower(trim(p_username)) and active for update;
  if not found or v_user.pass_hash<>extensions.crypt(p_old_password,v_user.pass_hash) then return jsonb_build_object('ok',false,'error','password'); end if;
  update private.app_users set pass_hash=extensions.crypt(p_new_password,extensions.gen_salt('bf',12)),updated_at=now() where username=v_user.username;
  delete from private.sessions where username=v_user.username;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.app_leaderboard(p_token uuid, p_top integer default 20, p_period text default 'month')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_from timestamptz; v_top jsonb; v_me jsonb; v_total int;
begin
  v_username:=private.session_username(p_token);
  if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  v_from:=case p_period when 'month' then date_trunc('month',now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid'
                       when 'year' then date_trunc('year',now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid'
                       else '-infinity'::timestamptz end;
  with scores as (
    select u.username,coalesce(sum(case when e.delta>0 and e.type in ('spin','box','bet','revenue') then e.delta else 0 end),0)::bigint points
    from private.app_users u left join private.events e on e.username=u.username and e.created_at>=v_from
    where u.active and not u.is_builtin group by u.username
  ), ranked as (select username,points,dense_rank() over(order by points desc,username)::int rank from scores), topn as (
    select * from ranked order by rank,username limit greatest(1,least(coalesce(p_top,20),100))
  ) select coalesce(jsonb_agg(jsonb_build_object('rank',rank,'points',points,'me',username=v_username) order by rank,username),'[]'::jsonb)
    into v_top from topn;
  with scores as (
    select u.username,coalesce(sum(case when e.delta>0 and e.type in ('spin','box','bet','revenue') then e.delta else 0 end),0)::bigint points
    from private.app_users u left join private.events e on e.username=u.username and e.created_at>=v_from
    where u.active and not u.is_builtin group by u.username
  ), ranked as (select username,points,dense_rank() over(order by points desc,username)::int rank from scores)
  select jsonb_build_object('rank',r.rank,'points',r.points,'gap_to_next',greatest(0,coalesce((select points from ranked where rank=r.rank-1 order by username limit 1),r.points)-r.points)),
         (select count(*) from ranked) into v_me,v_total from ranked r where r.username=v_username;
  return jsonb_build_object('ok',true,'me',v_me,'top',v_top,'total',coalesce(v_total,0));
end $$;

create or replace function public.app_push_subscribe(p_token uuid, p_sub jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_username text; v_endpoint text;
begin
  v_username:=private.session_username(p_token); if v_username is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  v_endpoint:=p_sub->>'endpoint'; if v_endpoint is null or length(v_endpoint)>2048 or jsonb_typeof(p_sub)<>'object' then return jsonb_build_object('ok',false,'error','subscription'); end if;
  insert into private.push_subscriptions(endpoint,username,is_admin,subscription) values(v_endpoint,v_username,false,p_sub)
    on conflict(endpoint) do update set username=excluded.username,is_admin=false,subscription=excluded.subscription,updated_at=now();
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.app_demo_credit(p_amount integer)
returns jsonb language sql immutable set search_path = '' as $$ select jsonb_build_object('ok',false,'error','demo_only') $$;

create or replace function public.app_admin_check(p_pin text)
returns boolean language sql stable security definer set search_path = '' as $$ select private.is_admin(p_pin) $$;

create or replace function public.app_admin_push_subscribe(p_pin text, p_sub jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_endpoint text;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  v_endpoint:=p_sub->>'endpoint'; if v_endpoint is null or length(v_endpoint)>2048 then return jsonb_build_object('ok',false,'error','subscription'); end if;
  insert into private.push_subscriptions(endpoint,is_admin,subscription) values(v_endpoint,true,p_sub)
    on conflict(endpoint) do update set username=null,is_admin=true,subscription=excluded.subscription,updated_at=now();
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.app_admin_redemptions(p_pin text)
returns table(id text,username text,bar text,premio text,puntos bigint,delivered boolean,delivered_at timestamptz,cancelled boolean,cancelled_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin(p_pin) then return; end if;
  return query select r.id::text,r.username,r.bar,r.premio,r.puntos,r.delivered,r.delivered_at,r.cancelled,r.cancelled_at,r.created_at
    from private.redemptions r order by r.created_at desc limit 1000;
end $$;

create or replace function public.app_admin_set_delivered(p_pin text, p_id text, p_delivered boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_id uuid;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  begin v_id:=p_id::uuid; exception when invalid_text_representation then return jsonb_build_object('ok',false,'error','id'); end;
  update private.redemptions set delivered=coalesce(p_delivered,false),delivered_at=case when p_delivered then now() else null end where id=v_id and not cancelled;
  return jsonb_build_object('ok',found);
end $$;

create or replace function public.app_admin_save_config(p_pin text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_credit jsonb; v_user text; v_rev bigint;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>4194304 then return jsonb_build_object('ok',false,'error','config'); end if;
  v_rev:=greatest(coalesce((p_data->>'rev')::bigint,0),(extract(epoch from clock_timestamp())*1000)::bigint);
  update private.app_config set data=p_data-'users'-'credits'-'rev',rev=v_rev,updated_at=now() where singleton;
  for v_credit in select value from jsonb_array_elements(coalesce(p_data->'credits','[]'::jsonb)) loop
    v_user:=lower(trim(v_credit->>'u'));
    if exists(select 1 from private.app_users where username=v_user and active) and length(coalesce(v_credit->>'id','')) between 1 and 120 then
      insert into private.revenue_credits(id,username,eur,days,points,base_points,bonus_points,reference_daily,concept,credit_date)
      values(v_credit->>'id',v_user,greatest(0,coalesce((v_credit->>'eur')::numeric,0)),greatest(0,coalesce((v_credit->>'dias')::int,0)),
             greatest(0,coalesce((v_credit->>'pts')::bigint,0)),coalesce((v_credit->>'base')::bigint,0),coalesce((v_credit->>'bonus')::bigint,0),
             nullif(v_credit->>'ref','')::numeric,left(coalesce(v_credit->>'concept',''),300),coalesce((v_credit->>'date')::date,private.today_madrid()))
      on conflict(id) do update set username=excluded.username,eur=excluded.eur,days=excluded.days,points=excluded.points,
        base_points=excluded.base_points,bonus_points=excluded.bonus_points,reference_daily=excluded.reference_daily,concept=excluded.concept,credit_date=excluded.credit_date
      where private.revenue_credits.claimed_at is null;
    end if;
  end loop;
  return jsonb_build_object('ok',true,'rev',v_rev);
end $$;

create or replace function public.app_admin_players(p_pin text)
returns table(username text,points bigint) language plpgsql security definer set search_path = ''
as $$ begin if not private.is_admin(p_pin) then return; end if; return query select p.username,p.points from private.players p order by p.username; end $$;

create or replace function public.app_admin_users(p_pin text)
returns table(username text,nombre text,bar text) language plpgsql security definer set search_path = ''
as $$ begin if not private.is_admin(p_pin) then return; end if; return query select u.username,u.nombre,u.bar from private.app_users u where u.active order by u.username; end $$;

create or replace function public.app_admin_upsert_user(p_pin text,p_username text,p_password text,p_nombre text,p_bar text)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_username text:=lower(trim(p_username));
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if v_username !~ '^[a-z0-9_.-]{2,40}$' or length(coalesce(p_nombre,'')) not between 1 and 120 or length(coalesce(p_bar,'')) not between 1 and 160 then return jsonb_build_object('ok',false,'error','input'); end if;
  if not exists(select 1 from private.app_users where username=v_username) and length(coalesce(p_password,''))<8 then return jsonb_build_object('ok',false,'error','weak'); end if;
  if length(coalesce(p_password,''))>128 then return jsonb_build_object('ok',false,'error','weak'); end if;
  insert into private.app_users(username,pass_hash,nombre,bar) values(v_username,extensions.crypt(p_password,extensions.gen_salt('bf',12)),p_nombre,p_bar)
  on conflict(username) do update set pass_hash=case when coalesce(p_password,'')<>'' then extensions.crypt(p_password,extensions.gen_salt('bf',12)) else private.app_users.pass_hash end,
    nombre=excluded.nombre,bar=excluded.bar,active=true,updated_at=now();
  insert into private.players(username) values(v_username) on conflict do nothing;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.app_admin_set_points(p_pin text,p_username text,p_points bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_username text:=lower(trim(p_username)); v_before bigint; v_bar text;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if p_points is null or p_points<0 or p_points>100000000 then return jsonb_build_object('ok',false,'error','points'); end if;
  select points into v_before from private.players where username=v_username for update;
  if not found then return jsonb_build_object('ok',false,'error','nouser'); end if;
  update private.players set points=p_points,updated_at=now() where username=v_username;
  select bar into v_bar from private.app_users where username=v_username;
  insert into private.events(username,bar,type,label,delta,meta) values(v_username,v_bar,'admin','Ajuste administrativo',p_points-v_before,jsonb_build_object('before',v_before,'after',p_points));
  return jsonb_build_object('ok',true,'points',p_points);
end $$;

create or replace function public.app_admin_reset_password(p_pin text,p_username text,p_new_password text)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_username text:=lower(trim(p_username));
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if length(coalesce(p_new_password,''))<8 or length(coalesce(p_new_password,''))>128 then return jsonb_build_object('ok',false,'error','weak'); end if;
  update private.app_users set pass_hash=extensions.crypt(p_new_password,extensions.gen_salt('bf',12)),failed_attempts=0,locked_until=null,updated_at=now() where username=v_username and active;
  if not found then return jsonb_build_object('ok',false,'error','nouser'); end if;
  delete from private.sessions where username=v_username;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.app_admin_delete_user(p_pin text,p_username text)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_username text:=lower(trim(p_username));
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if exists(select 1 from private.app_users where username=v_username and is_builtin) then return jsonb_build_object('ok',false,'error','builtin'); end if;
  delete from private.app_users where username=v_username;
  return jsonb_build_object('ok',found, 'error',case when found then null else 'nouser' end);
end $$;

create or replace function public.app_admin_events(p_pin text,p_username text default null,p_limit integer default 400)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_events jsonb;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_events from (
    select e.id,e.username,e.bar,e.type,e.label,e.delta,e.meta,e.created_at from private.events e
    where p_username is null or e.username=lower(trim(p_username)) order by e.created_at desc limit greatest(1,least(coalesce(p_limit,400),1000))
  ) x;
  return jsonb_build_object('ok',true,'events',v_events);
end $$;

create or replace function public.app_admin_stats(p_pin text)
returns jsonb language plpgsql security definer set search_path = ''
as $$ declare v_out jsonb;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  select jsonb_build_object(
    'ok',true,
    'players_total',(select count(*) from private.app_users where active and not is_builtin),
    'players_active7',(select count(*) from private.players p join private.app_users u using(username) where u.active and not u.is_builtin and p.last_seen_at>=now()-interval '7 days'),
    'points_held',(select coalesce(sum(p.points),0) from private.players p join private.app_users u using(username) where u.active and not u.is_builtin),
    'points_redeemed',(select coalesce(sum(puntos),0) from private.redemptions where not cancelled),
    'spins_total',(select count(*) from private.events where type='spin'),
    'spins_today',(select count(*) from private.events where type='spin' and (created_at at time zone 'Europe/Madrid')::date=private.today_madrid()),
    'bets_count',(select count(*) from private.events where type='bet'),
    'bets_delta',(select coalesce(sum(delta),0) from private.events where type='bet'),
    'redeem_total',(select count(*) from private.redemptions where not cancelled),
    'redeem_pending',(select count(*) from private.redemptions where not delivered and not cancelled),
    'daily',(select coalesce(jsonb_agg(jsonb_build_object('d',d,'spins',spins) order by d),'[]'::jsonb) from (
       select gs::date d,count(e.id) spins from generate_series(private.today_madrid()-13,private.today_madrid(),interval '1 day') gs
       left join private.events e on e.type='spin' and (e.created_at at time zone 'Europe/Madrid')::date=gs::date group by gs::date) q),
    'top_prizes',(select coalesce(jsonb_agg(jsonb_build_object('name',premio,'n',n) order by n desc),'[]'::jsonb) from (select premio,count(*) n from private.redemptions where not cancelled group by premio order by n desc limit 5) q),
    'top_players',(select coalesce(jsonb_agg(jsonb_build_object('username',q.username,'points',q.points) order by q.points desc),'[]'::jsonb)
      from (select p.username,p.points from private.players p join private.app_users u using(username)
            where u.active and not u.is_builtin order by p.points desc limit 5) q),
    'ts',now()
  ) into v_out;
  return v_out;
end $$;

-- Every public RPC is denied by default, then only the intended browser API is granted.
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

notify pgrst, 'reload schema';
