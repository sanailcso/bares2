-- Disposable PostgreSQL only; no customer data is modified.
begin;
create function pg_temp.survey_assert(p_ok boolean,p_message text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception '%',p_message; end if; end $$;
do $$
declare
  a uuid; b uuid; inactive uuid; expired uuid; s uuid:=gen_random_uuid(); bars uuid:=gen_random_uuid();
  rating uuid:=gen_random_uuid(); free_text uuid:=gen_random_uuid(); multi uuid:=gen_random_uuid();
  base jsonb; saved jsonb; r jsonb; original jsonb; bad jsonb; item jsonb;
begin
  update private.admin_settings set pin_hash=extensions.crypt('test-admin-pin',extensions.gen_salt('bf'));
  insert into private.app_users(username,pass_hash,nombre,bar,active) values
    ('survey_a','fixture','Cliente A','Bar Uno',true),('survey_b','fixture','Cliente B','Bar Dos',true),
    ('survey_off','fixture','Inactivo','Bar Uno',false);
  insert into private.sessions(username) values('survey_a') returning token into a;
  insert into private.sessions(username) values('survey_b') returning token into b;
  insert into private.sessions(username) values('survey_off') returning token into inactive;
  insert into private.sessions(username,expires_at) values('survey_a',now()-interval '1 hour') returning token into expired;
  perform pg_temp.survey_assert(public.app_pending_surveys(expired)->>'error'='auth','Expired session accepted');
  base:=jsonb_build_object('id',s,'question','¿Qué regalo prefieres?','kind','single','image','',
    'options',jsonb_build_array(jsonb_build_object('id','one','label','Uno'),jsonb_build_object('id','two','label','Dos')),
    'audience','clients','targets',jsonb_build_array('survey_a'),'status','draft','starts_at',null,'ends_at',null);
  perform pg_temp.survey_assert(public.app_admin_save_survey('wrong',base,0)->>'error'='pin','Wrong admin PIN accepted');
  r:=public.app_admin_save_survey('test-admin-pin',base,0);
  perform pg_temp.survey_assert((r->>'ok')::boolean,'Cannot save draft');
  perform pg_temp.survey_assert(jsonb_array_length(public.app_pending_surveys(a)->'surveys')=0,'Draft visible');
  base:=base||jsonb_build_object('status','active');
  r:=public.app_admin_save_survey('test-admin-pin',base,1);
  perform pg_temp.survey_assert((r->>'ok')::boolean,'Cannot activate targeted survey');
  saved:=r->'survey';
  perform pg_temp.survey_assert(public.app_admin_save_survey('test-admin-pin',base,1)->>'error'='conflict','Stale edit overwrote current data');
  r:=public.app_pending_surveys(a);
  perform pg_temp.survey_assert(jsonb_array_length(r->'surveys')=1,'Recipient cannot see survey');
  perform pg_temp.survey_assert(not ((r->'surveys'->0) ? 'targets') and not ((r->'surveys'->0) ? 'audience'),'Private audience leaked to player');
  perform pg_temp.survey_assert(jsonb_array_length(public.app_pending_surveys(b)->'surveys')=0,'Private survey leaked to another customer');
  perform pg_temp.survey_assert(public.app_answer_survey(b,s,'["one"]')->>'error'='unavailable','Unselected customer could answer');
  perform pg_temp.survey_assert(public.app_answer_survey(inactive,s,'["one"]')->>'error'='auth','Inactive customer could answer');
  foreach bad in array array['null'::jsonb,'[]'::jsonb,'["fake"]'::jsonb,'["one","two"]'::jsonb,'[1]'::jsonb] loop
    perform pg_temp.survey_assert(public.app_answer_survey(a,s,bad)->>'error'='answer','Invalid single answer accepted');
  end loop;
  r:=public.app_answer_survey(a,s,'["one"]');
  perform pg_temp.survey_assert((r->>'ok')::boolean,'Valid answer rejected');
  r:=public.app_answer_survey(a,s,'["two"]');
  perform pg_temp.survey_assert((r->>'duplicate')::boolean,'Retry must be idempotent');
  perform pg_temp.survey_assert((select count(*)=1 from private.survey_responses where survey_id=s),'Duplicate answer stored');
  perform pg_temp.survey_assert(jsonb_array_length(public.app_pending_surveys(a)->'surveys')=0,'Answered survey reappeared');
  perform pg_temp.survey_assert(public.app_admin_save_survey('test-admin-pin',base||'{"question":"Changed"}',2)->>'error'='answered','Answered question edited');
  r:=public.app_admin_survey_results('test-admin-pin',s,0);
  perform pg_temp.survey_assert(r->>'total'='1' and r#>>'{counts,0,count}'='1' and r#>>'{counts,1,count}'='0','Wrong result counts');
  perform pg_temp.survey_assert(r#>>'{responses,0,username}'='survey_a','Result missing identity');
  perform pg_temp.survey_assert(public.app_admin_survey_results('wrong',s,0)->>'error'='pin','Results leaked without PIN');
  r:=public.app_admin_save_survey('test-admin-pin',base||'{"status":"closed"}',2);
  perform pg_temp.survey_assert((r->>'ok')::boolean,'Cannot close answered survey');

  -- Bar audiences are resolved from server membership, including new customers.
  r:=public.app_admin_save_survey('test-admin-pin',base||jsonb_build_object('id',bars,'audience','bars','targets',jsonb_build_array('Bar Uno')),0);
  perform pg_temp.survey_assert((r->>'ok')::boolean,'Bar targeting failed');
  perform pg_temp.survey_assert(jsonb_array_length(public.app_pending_surveys(a)->'surveys')=1,'Bar recipient missing');
  perform pg_temp.survey_assert(jsonb_array_length(public.app_pending_surveys(b)->'surveys')=0,'Wrong bar saw survey');
  update private.app_users set bar='Bar Uno' where username='survey_b';
  perform pg_temp.survey_assert(jsonb_array_length(public.app_pending_surveys(b)->'surveys')=1,'Updated membership ignored');
  r:=public.app_admin_save_survey('test-admin-pin',base||jsonb_build_object('id',bars,'audience','bars','targets',jsonb_build_array('Bar Uno'),'starts_at',now()+interval '1 day'),1);
  perform pg_temp.survey_assert((r->>'ok')::boolean and jsonb_array_length(public.app_pending_surveys(a)->'surveys')=0,'Future survey visible');
  r:=public.app_admin_save_survey('test-admin-pin',base||jsonb_build_object('id',bars,'audience','bars','targets',jsonb_build_array('Bar Uno'),'ends_at',now()-interval '1 second'),2);
  perform pg_temp.survey_assert((r->>'ok')::boolean and public.app_answer_survey(a,bars,'["one"]')->>'error'='unavailable','Expired survey accepted answer');
  r:=public.app_admin_save_survey('test-admin-pin',base||jsonb_build_object('id',gen_random_uuid(),'audience','clients','targets',jsonb_build_array('unknown')),0);
  perform pg_temp.survey_assert(r->>'error'='targets','Unknown recipient accepted');

  -- All answer types and malformed admin payloads are validated by the server.
  foreach item in array array[
    jsonb_build_object('id',rating,'kind','rating'),jsonb_build_object('id',free_text,'kind','text'),
    jsonb_build_object('id',multi,'kind','multiple')
  ] loop
    r:=public.app_admin_save_survey('test-admin-pin',base||item||'{"audience":"all","targets":[]}',0);
    perform pg_temp.survey_assert((r->>'ok')::boolean,'Cannot save answer type');
  end loop;
  perform pg_temp.survey_assert(public.app_answer_survey(a,rating,'6')->>'error'='answer','Rating out of range accepted');
  perform pg_temp.survey_assert(public.app_answer_survey(a,rating,'"5"')->>'error'='answer','String rating accepted');
  perform pg_temp.survey_assert((public.app_answer_survey(a,rating,'5')->>'ok')::boolean,'Valid rating rejected');
  perform pg_temp.survey_assert(public.app_answer_survey(a,free_text,'"  "')->>'error'='answer','Empty text accepted');
  perform pg_temp.survey_assert((public.app_answer_survey(a,free_text,'" Me encanta "')->>'ok')::boolean,'Valid text rejected');
  perform pg_temp.survey_assert((select answer='"Me encanta"'::jsonb from private.survey_responses where survey_id=free_text and username='survey_a'),'Text was not trimmed');
  perform pg_temp.survey_assert(public.app_answer_survey(a,multi,'["one","one"]')->>'error'='answer','Duplicate options accepted');
  perform pg_temp.survey_assert((public.app_answer_survey(a,multi,'["one","two"]')->>'ok')::boolean,'Valid multiple choice rejected');
  r:=public.app_admin_survey_results('test-admin-pin',multi,0);
  perform pg_temp.survey_assert(r#>>'{counts,0,count}'='1' and r#>>'{counts,1,count}'='1','Multiple choice counts wrong');
  foreach bad in array array['null'::jsonb,'[]'::jsonb,
    base||'{"id":"bad"}',base||'{"question":""}',base||'{"options":null}',
    base||'{"image":"javascript:alert(1)"}',base||'{"targets":[null]}',base||'{"kind":null}',
    base||'{"options":[{"id":"one","label":"a"},{"id":"one","label":"b"}]}'
  ] loop
    perform pg_temp.survey_assert(public.app_admin_save_survey('test-admin-pin',bad,0)->>'error' in ('invalid','targets'),'Malformed survey accepted');
  end loop;
  perform pg_temp.survey_assert(not has_table_privilege('anon','private.surveys','select'),'Anon can read surveys table');
  perform pg_temp.survey_assert(not has_table_privilege('anon','private.survey_responses','insert'),'Anon can insert answers directly');
  perform pg_temp.survey_assert(not has_function_privilege('anon','private.survey_visible(private.surveys,text)','execute'),'Anon can bypass private eligibility helper');
  perform pg_temp.survey_assert(not (public.app_public_config() ? 'surveys'),'Surveys leaked through public config');
  raise notice 'Survey audiences, dates, answers, idempotency, editing and privacy passed';
end $$;
-- Exercise the actual exposed RPC wrapper using the same role as PostgREST.
set local role anon;
select public.app_pending_surveys('00000000-0000-0000-0000-000000000000');
reset role;
rollback;
