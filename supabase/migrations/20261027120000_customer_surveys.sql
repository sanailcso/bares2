begin;

-- Surveys are deliberately separate from app_public_config: audiences and answers
-- must never be included in the public configuration downloaded by every client.
create table private.surveys (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(question) between 1 and 300),
  kind text not null check (kind in ('single','multiple','rating','text')),
  options jsonb not null default '[]'::jsonb,
  image text not null default '',
  audience text not null check (audience in ('all','bars','clients')),
  targets text[] not null default '{}',
  status text not null check (status in ('draft','active','closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create table private.survey_responses (
  survey_id uuid not null references private.surveys(id),
  username text not null references private.app_users(username),
  answer jsonb not null,
  created_at timestamptz not null default now(),
  primary key(survey_id,username)
);
create index survey_responses_user on private.survey_responses(username,survey_id);
alter table private.surveys enable row level security;
alter table private.survey_responses enable row level security;
revoke all on private.surveys,private.survey_responses from public,anon,authenticated;

create function private.survey_image_valid(p_image text)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(p_image='',false) or (length(p_image)<=220000 and
    (p_image ~ '^https://[^[:space:]<>]+$' or p_image ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'))
$$;
create function private.survey_visible(p_survey private.surveys,p_username text)
returns boolean language sql stable security definer set search_path='' as $$
  select p_survey.status='active'
    and (p_survey.starts_at is null or p_survey.starts_at<=now())
    and (p_survey.ends_at is null or p_survey.ends_at>now())
    and exists(select 1 from private.app_users u where u.username=p_username and u.active and
      (p_survey.audience='all' or (p_survey.audience='clients' and u.username=any(p_survey.targets))
       or (p_survey.audience='bars' and u.bar=any(p_survey.targets))))
$$;

create function private.app_pending_surveys(p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user text;
begin
  v_user:=private.session_username(p_token);
  if v_user is null then return jsonb_build_object('ok',false,'error','auth'); end if;
  return jsonb_build_object('ok',true,'surveys',coalesce((
    select jsonb_agg(jsonb_build_object('id',s.id,'question',s.question,'kind',s.kind,
      'options',s.options,'image',s.image,'ends_at',s.ends_at) order by s.created_at,s.id)
    from private.surveys s where private.survey_visible(s,v_user)
      and not exists(select 1 from private.survey_responses r where r.survey_id=s.id and r.username=v_user)
  ),'[]'::jsonb));
end $$;

create function private.app_answer_survey(p_token uuid,p_id uuid,p_answer jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user text; v_s private.surveys; v_count integer;
begin
  v_user:=private.session_username(p_token);
  if v_user is null or not exists(select 1 from private.app_users where username=v_user and active) then
    return jsonb_build_object('ok',false,'error','auth'); end if;
  -- The same lock is taken by admin edits: closing/changing a survey and answering
  -- cannot race. The primary key makes retries and simultaneous devices idempotent.
  select * into v_s from private.surveys where id=p_id for update;
  if not found then return jsonb_build_object('ok',false,'error','unavailable'); end if;
  if exists(select 1 from private.survey_responses where survey_id=p_id and username=v_user) then
    return jsonb_build_object('ok',true,'duplicate',true); end if;
  if not private.survey_visible(v_s,v_user) then return jsonb_build_object('ok',false,'error','unavailable'); end if;
  if p_answer is null then return jsonb_build_object('ok',false,'error','answer'); end if;
  if v_s.kind in ('single','multiple') then
    if jsonb_typeof(p_answer)<>'array' then return jsonb_build_object('ok',false,'error','answer'); end if;
    v_count:=jsonb_array_length(p_answer);
    if v_count<1 or v_count>jsonb_array_length(v_s.options) or (v_s.kind='single' and v_count<>1)
      or (select count(distinct value) from jsonb_array_elements(p_answer))<>v_count
      or exists(select 1 from jsonb_array_elements(p_answer) a where jsonb_typeof(a)<>'string'
        or not exists(select 1 from jsonb_array_elements(v_s.options) o where o->>'id'=a#>>'{}')) then
      return jsonb_build_object('ok',false,'error','answer'); end if;
  elsif v_s.kind='rating' then
    if not (p_answer=any(array['1'::jsonb,'2'::jsonb,'3'::jsonb,'4'::jsonb,'5'::jsonb])) then
      return jsonb_build_object('ok',false,'error','answer'); end if;
  else
    if jsonb_typeof(p_answer)<>'string' or length(trim(p_answer#>>'{}')) not between 1 and 2000 then
      return jsonb_build_object('ok',false,'error','answer'); end if;
    p_answer:=to_jsonb(trim(p_answer#>>'{}'));
  end if;
  insert into private.survey_responses(survey_id,username,answer) values(p_id,v_user,p_answer);
  return jsonb_build_object('ok',true);
end $$;

create function private.app_admin_save_survey(p_pin text,p_survey jsonb,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_s private.surveys; v_old private.surveys; v_exists boolean; v_targets text[];
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if jsonb_typeof(p_survey) is distinct from 'object' or octet_length(p_survey::text)>2100000 then
    return jsonb_build_object('ok',false,'error','invalid'); end if;
  begin
    v_s.id:=(p_survey->>'id')::uuid;
    v_s.starts_at:=nullif(p_survey->>'starts_at','')::timestamptz;
    v_s.ends_at:=nullif(p_survey->>'ends_at','')::timestamptz;
  exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format then
    return jsonb_build_object('ok',false,'error','invalid');
  end;
  v_s.question:=trim(p_survey->>'question'); v_s.kind:=p_survey->>'kind';
  v_s.image:=coalesce(p_survey->>'image',''); v_s.audience:=p_survey->>'audience';
  v_s.status:=p_survey->>'status'; v_s.options:=p_survey->'options';
  if v_s.id is null or coalesce(length(v_s.question),0) not between 1 and 300
    or v_s.kind is null or v_s.kind not in ('single','multiple','rating','text')
    or v_s.audience is null or v_s.audience not in ('all','bars','clients')
    or v_s.status is null or v_s.status not in ('draft','active','closed')
    or not private.survey_image_valid(v_s.image)
    or jsonb_typeof(v_s.options) is distinct from 'array'
    or jsonb_typeof(p_survey->'targets') is distinct from 'array'
    or (v_s.ends_at is not null and v_s.starts_at is not null and v_s.ends_at<=v_s.starts_at)
    or (v_s.starts_at is not null and not isfinite(v_s.starts_at))
    or (v_s.ends_at is not null and not isfinite(v_s.ends_at)) then
    return jsonb_build_object('ok',false,'error','invalid'); end if;
  if jsonb_array_length(v_s.options)>8 or jsonb_array_length(p_survey->'targets')>1000 then
    return jsonb_build_object('ok',false,'error','invalid'); end if;
  if v_s.kind in ('single','multiple') then
    if jsonb_array_length(v_s.options)<2 or exists(select 1 from jsonb_array_elements(v_s.options) o where
      jsonb_typeof(o) is distinct from 'object' or jsonb_typeof(o->'label') is distinct from 'string'
      or coalesce(length(trim(o->>'label')),0) not between 1 and 160
      or coalesce(o->>'id','') !~ '^[a-z0-9_-]{1,40}$'
      or not private.survey_image_valid(coalesce(o->>'image','')))
      or (select count(distinct o->>'id') from jsonb_array_elements(v_s.options) o)<>jsonb_array_length(v_s.options) then
      return jsonb_build_object('ok',false,'error','invalid'); end if;
    select jsonb_agg(jsonb_build_object('id',o->>'id','label',trim(o->>'label'),'image',coalesce(o->>'image','')) order by n)
      into v_s.options from jsonb_array_elements(v_s.options) with ordinality as x(o,n);
  else v_s.options:='[]'::jsonb; end if;
  if exists(select 1 from jsonb_array_elements(p_survey->'targets') t where jsonb_typeof(t)<>'string') then
    return jsonb_build_object('ok',false,'error','invalid'); end if;
  select coalesce(array_agg(distinct t order by t),'{}') into v_targets from jsonb_array_elements_text(p_survey->'targets') t;
  v_s.targets:=case when v_s.audience='all' then '{}'::text[] else v_targets end;
  if v_s.audience<>'all' and (cardinality(v_s.targets)=0 or exists(select 1 from unnest(v_s.targets) t
    where not exists(select 1 from private.app_users u where u.active and
      ((v_s.audience='clients' and u.username=t) or (v_s.audience='bars' and u.bar=t))))) then
    return jsonb_build_object('ok',false,'error','targets'); end if;
  -- Serialize creation of the same UUID too; a stale admin never overwrites changes.
  perform pg_advisory_xact_lock(hashtextextended(v_s.id::text,0));
  select * into v_old from private.surveys where id=v_s.id for update;
  v_exists:=found;
  if (v_exists and p_expected_version is distinct from v_old.version) or
     (not v_exists and p_expected_version is distinct from 0) then
    return jsonb_build_object('ok',false,'error','conflict'); end if;
  if v_exists and exists(select 1 from private.survey_responses where survey_id=v_s.id) and
    (v_s.question,v_s.kind,v_s.options,v_s.image,v_s.audience,v_s.targets) is distinct from
    (v_old.question,v_old.kind,v_old.options,v_old.image,v_old.audience,v_old.targets) then
    return jsonb_build_object('ok',false,'error','answered'); end if;
  insert into private.surveys(id,question,kind,options,image,audience,targets,status,starts_at,ends_at)
    values(v_s.id,v_s.question,v_s.kind,v_s.options,v_s.image,v_s.audience,v_s.targets,v_s.status,v_s.starts_at,v_s.ends_at)
  on conflict(id) do update set question=excluded.question,kind=excluded.kind,options=excluded.options,
    image=excluded.image,audience=excluded.audience,targets=excluded.targets,status=excluded.status,
    starts_at=excluded.starts_at,ends_at=excluded.ends_at,version=private.surveys.version+1,updated_at=now()
  returning * into v_s;
  return jsonb_build_object('ok',true,'survey',to_jsonb(v_s));
end $$;

create function private.app_admin_surveys(p_pin text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  return jsonb_build_object('ok',true,'surveys',coalesce((select jsonb_agg(to_jsonb(s)||
    jsonb_build_object('response_count',(select count(*) from private.survey_responses r where r.survey_id=s.id))
    order by s.created_at desc,s.id) from private.surveys s),'[]'::jsonb));
end $$;

create function private.app_admin_survey_results(p_pin text,p_id uuid,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_s private.surveys; v_total integer; v_counts jsonb; v_rows jsonb;
begin
  if not private.is_admin(p_pin) then return jsonb_build_object('ok',false,'error','pin'); end if;
  if p_offset is null or p_offset<0 then return jsonb_build_object('ok',false,'error','invalid'); end if;
  select * into v_s from private.surveys where id=p_id;
  if not found then return jsonb_build_object('ok',false,'error','unavailable'); end if;
  select count(*) into v_total from private.survey_responses where survey_id=p_id;
  if v_s.kind in ('single','multiple') then
    select coalesce(jsonb_agg(jsonb_build_object('label',o->>'label','count',
      (select count(*) from private.survey_responses r where r.survey_id=p_id and r.answer ? (o->>'id'))) order by n),'[]')
      into v_counts from jsonb_array_elements(v_s.options) with ordinality as x(o,n);
  elsif v_s.kind='rating' then
    select jsonb_agg(jsonb_build_object('label',i::text||' / 5','count',
      (select count(*) from private.survey_responses r where r.survey_id=p_id and r.answer=to_jsonb(i))) order by i)
      into v_counts from generate_series(1,5) i;
  else v_counts:='[]'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.username),'[]') into v_rows from (
    select r.username,u.nombre,u.bar,r.answer,r.created_at from private.survey_responses r
      join private.app_users u on u.username=r.username where r.survey_id=p_id
      order by r.created_at desc,r.username limit 50 offset p_offset
  ) x;
  return jsonb_build_object('ok',true,'total',v_total,'counts',v_counts,'responses',v_rows,
    'next_offset',case when p_offset+50<v_total then p_offset+50 else null end);
end $$;

revoke all on function private.survey_image_valid(text),private.survey_visible(private.surveys,text),
  private.app_pending_surveys(uuid),private.app_answer_survey(uuid,uuid,jsonb),
  private.app_admin_save_survey(text,jsonb,integer),private.app_admin_surveys(text),
  private.app_admin_survey_results(text,uuid,integer) from public,anon,authenticated;
grant execute on function private.app_pending_surveys(uuid),private.app_answer_survey(uuid,uuid,jsonb),
  private.app_admin_save_survey(text,jsonb,integer),private.app_admin_surveys(text),
  private.app_admin_survey_results(text,uuid,integer) to anon;
create function public.app_pending_surveys(p_token uuid) returns jsonb language sql volatile security invoker set search_path=''
  as $$ select private.app_pending_surveys(p_token) $$;
create function public.app_answer_survey(p_token uuid,p_id uuid,p_answer jsonb) returns jsonb language sql volatile security invoker set search_path=''
  as $$ select private.app_answer_survey(p_token,p_id,p_answer) $$;
create function public.app_admin_save_survey(p_pin text,p_survey jsonb,p_expected_version integer) returns jsonb language sql volatile security invoker set search_path=''
  as $$ select private.app_admin_save_survey(p_pin,p_survey,p_expected_version) $$;
create function public.app_admin_surveys(p_pin text) returns jsonb language sql volatile security invoker set search_path=''
  as $$ select private.app_admin_surveys(p_pin) $$;
create function public.app_admin_survey_results(p_pin text,p_id uuid,p_offset integer default 0) returns jsonb language sql volatile security invoker set search_path=''
  as $$ select private.app_admin_survey_results(p_pin,p_id,p_offset) $$;
revoke all on function public.app_pending_surveys(uuid),public.app_answer_survey(uuid,uuid,jsonb),
  public.app_admin_save_survey(text,jsonb,integer),public.app_admin_surveys(text),
  public.app_admin_survey_results(text,uuid,integer) from public,anon,authenticated;
grant execute on function public.app_pending_surveys(uuid),public.app_answer_survey(uuid,uuid,jsonb),
  public.app_admin_save_survey(text,jsonb,integer),public.app_admin_surveys(text),
  public.app_admin_survey_results(text,uuid,integer) to anon;
notify pgrst,'reload schema';
commit;
