-- Disposable database only. All fixture writes are rolled back.
begin;
do $$
declare v_login jsonb; v_first jsonb; v_again jsonb; v_resume jsonb; v_token uuid;
  v_points bigint; v_cfg jsonb; v_saved jsonb; v_bet jsonb; v_public jsonb;
begin
  v_login:=public.app_login('demo','demo');
  if not (v_login->>'ok')::boolean then raise exception 'Fixture login failed'; end if;
  v_token:=(v_login->>'token')::uuid;
  v_first:=public.app_spin(v_token);
  if not (v_first->>'ok')::boolean then raise exception 'First daily spin denied'; end if;
  v_points:=(v_first->>'points')::bigint;
  v_resume:=public.app_resume(v_token);
  if (v_resume#>>'{state,lastSpin}')::date<>private.today_madrid() then raise exception 'Resume lost the daily spin'; end if;
  v_again:=public.app_spin(v_token);
  if v_again->>'error'<>'already' then raise exception 'Reload granted another daily spin'; end if;
  if (private.player_state('demo')->>'points')::bigint<>v_points then raise exception 'Duplicate spin changed points'; end if;
  v_login:=public.app_login('demo','demo');
  v_again:=public.app_spin((v_login->>'token')::uuid);
  if v_again->>'error'<>'already' then raise exception 'New login bypassed the daily limit'; end if;
  update private.players set last_spin=private.today_madrid()-1 where username='demo';
  v_again:=public.app_spin(v_token);
  if not (v_again->>'ok')::boolean then raise exception 'Next day did not unlock'; end if;

  update private.admin_settings set pin_hash=extensions.crypt('test-admin-pin',extensions.gen_salt('bf'));
  select data into v_cfg from private.app_config where singleton;
  v_cfg:=jsonb_set(v_cfg,'{bet,segments}','[{"mult":1.5,"w":1},{"mult":2,"w":1}]');
  v_saved:=public.app_admin_save_config('test-admin-pin',v_cfg);
  if not (v_saved->>'ok')::boolean then raise exception 'Admin roulette save failed'; end if;
  v_public:=public.app_public_config();
  if v_public#>'{bet,segments}'<>v_cfg#>'{bet,segments}' then raise exception 'Client config differs from admin'; end if;
  update private.players set points=1000,bet_spins=2 where username='demo';
  v_points:=(private.player_state('demo')->>'points')::bigint;
  v_bet:=public.app_bet(v_token,100);
  if not (v_bet->>'ok')::boolean or (v_bet->>'mult')::numeric not in (1.5,2) then raise exception 'Saved roulette cannot be played: %',v_bet; end if;
  if (v_bet->>'points')::bigint<>v_points-100+floor(100*(v_bet->>'mult')::numeric) then raise exception 'Roulette point contract changed'; end if;
  if (v_bet->>'afterStake')::bigint<>v_points-100 then raise exception 'Stake was not debited'; end if;
  if not exists(select 1 from private.events where username='demo' and type='bet' and delta=(v_bet->>'gain')::bigint-100) then raise exception 'Ledger must record net gain'; end if;
  v_points:=(v_bet->>'points')::bigint;
  update private.players set points=99 where username='demo';
  v_bet:=public.app_bet(v_token,100);
  if v_bet->>'error'<>'funds' then raise exception 'Insufficient funds accepted'; end if;
  if (select points<>99 or bet_spins<>1 from private.players where username='demo') then raise exception 'Rejected bet changed player'; end if;
  update private.players set points=1000 where username='demo';
  update private.app_config set data=jsonb_set(data,'{bet,segments}','[{"mult":1,"w":1},{"mult":1,"w":1}]') where singleton;
  v_bet:=public.app_bet(v_token,300);
  if (v_bet->>'points')::bigint<>1000 or (v_bet->>'gain')::bigint<>300 or (v_bet->>'afterStake')::bigint<>700 then raise exception 'x1 must return the stake: %',v_bet; end if;
  begin
    update private.app_config set data=jsonb_set(data,'{bet,segments}','[{"mult":0,"w":1},{"mult":0.5,"w":1}]') where singleton;
    raise exception 'Forbidden multipliers were accepted';
  exception when check_violation then null; end;
  begin
    update private.app_config set data=jsonb_set(data,'{bet,segments}','[{"mult":1,"w":0},{"mult":2,"w":0}]') where singleton;
    raise exception 'Zero total weight was accepted';
  exception when check_violation then null; end;
  raise notice 'Daily spin, resume, admin configuration and roulette tests passed';
end $$;
rollback;
