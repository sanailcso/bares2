-- Disposable PostgreSQL only. Reproduce a regular account with pending credits
-- after more plays than the obsolete perDay setting allowed.
begin;
do $$
declare v_token uuid; r jsonb; i integer;
begin
  insert into private.app_users(username,pass_hash,nombre,bar) values('roulette_credits_fixture','fixture','Fixture','Fixture');
  insert into private.players(username,points,bet_spins) values('roulette_credits_fixture',1000,4);
  insert into private.sessions(username) values('roulette_credits_fixture') returning token into v_token;
  update private.app_config set data=jsonb_set(jsonb_set(data,'{bet,perDay}','1'),'{bet,segments}',
    '[{"mult":1,"w":1},{"mult":1,"w":1}]') where singleton;
  insert into private.events(username,type,label,delta,meta)
    select 'roulette_credits_fixture','bet','Earlier play',0,'{}'::jsonb from generate_series(1,5);
  for i in 1..4 loop
    r:=public.app_bet(v_token,100);
    if (r->>'ok')::boolean is distinct from true then raise exception 'Earned credit blocked after old daily quota: %',r; end if;
    if (r->>'betSpins')::integer<>4-i then raise exception 'Credit count incorrect: %',r; end if;
    if (r->>'points')::bigint<>1000 or (r->>'afterStake')::bigint<>900 or (r->>'gain')::bigint<>100 then raise exception 'Accounting changed: %',r; end if;
  end loop;
  r:=public.app_bet(v_token,100);
  if r->>'error'<>'limit' or r->>'betSpins'<>'0' then raise exception 'Exhausted credits not rejected authoritatively: %',r; end if;
  if (select count(*) from private.events where username='roulette_credits_fixture' and type='bet')<>9 then raise exception 'Rejected spin created an event'; end if;
  update private.players set points=99,bet_spins=1 where username='roulette_credits_fixture';
  r:=public.app_bet(v_token,100);
  if r->>'error'<>'funds' or r->>'betSpins'<>'1' or r->>'points'<>'99' then raise exception 'Funds rejection changed or hid credits: %',r; end if;
  update private.players set points=1000 where username='roulette_credits_fixture';
  r:=public.app_bet(v_token,1);
  if r->>'error'<>'stake' then raise exception 'Out of range stake accepted'; end if;
  if exists(select 1 from private.players where username='roulette_credits_fixture' and (points<>1000 or bet_spins<>1)) then raise exception 'Rejected play consumed points or credit'; end if;
  -- A legacy malformed configuration must return a useful refusal, not HTTP 500.
  alter table private.app_config disable trigger validate_app_config;
  update private.app_config set data=jsonb_set(data,'{bet,segments}','{}') where singleton;
  r:=public.app_bet(v_token,100);
  if r->>'error'<>'odds' then raise exception 'Invalid segments not diagnosed: %',r; end if;
  update private.app_config set data=jsonb_set(data,'{bet,min}','"broken"') where singleton;
  r:=public.app_bet(v_token,100);
  if r->>'error'<>'odds' then raise exception 'Invalid config cast raised a server error: %',r; end if;
  if exists(select 1 from private.players where username='roulette_credits_fixture' and (points<>1000 or bet_spins<>1)) then raise exception 'Invalid config consumed points or credit'; end if;
  raise notice 'Earned roulette credits, exhausted credits, accounting and server diagnostics passed';
end $$;
rollback;
