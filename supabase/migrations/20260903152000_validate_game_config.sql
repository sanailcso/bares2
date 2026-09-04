begin;

create or replace function private.validate_app_config()
returns trigger language plpgsql security invoker set search_path=''
as $$
declare
  v_bet jsonb:=new.data->'bet';
  v_seg jsonb; v_weight numeric; v_mult numeric;
  v_total numeric:=0; v_weighted numeric:=0;
begin
  if jsonb_typeof(v_bet)<>'object'
     or jsonb_typeof(v_bet->'segments')<>'array'
     or jsonb_array_length(v_bet->'segments') not between 2 and 20 then
    raise exception using errcode='23514', message='invalid_bet_config';
  end if;
  for v_seg in select value from jsonb_array_elements(v_bet->'segments') loop
    begin
      v_weight:=(v_seg->>'w')::numeric;
      v_mult:=(v_seg->>'mult')::numeric;
    exception when others then
      raise exception using errcode='23514', message='invalid_bet_config';
    end;
    if v_weight<=0 or v_weight>1000000 or v_mult<0 or v_mult>20 then
      raise exception using errcode='23514', message='invalid_bet_config';
    end if;
    v_total:=v_total+v_weight;
    v_weighted:=v_weighted+v_weight*v_mult;
  end loop;
  if v_total<=0 or v_weighted/v_total>1 then
    raise exception using errcode='23514', message='roulette_return_above_one';
  end if;
  return new;
end $$;

drop trigger if exists validate_app_config on private.app_config;
create trigger validate_app_config
before insert or update of data on private.app_config
for each row execute function private.validate_app_config();

commit;
