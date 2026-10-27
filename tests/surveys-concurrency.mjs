// Two independent PostgreSQL sessions simulate the same customer on two devices.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
if (process.env.TIKITAKA_DB_TESTS !== '1') throw new Error('Requires the disposable CI database');
const exec = promisify(execFile);
async function sql(query) {
  const {stdout} = await exec('psql',['-h','localhost','-U','postgres','-d','postgres','-AtqX','-v','ON_ERROR_STOP=1','-c',query]);
  return stdout.split(/\r?\n/).filter(line => line.startsWith('{') || line.startsWith('[')).map(line => JSON.parse(line));
}
const user = 'survey_race_fixture';
let survey;
try {
  await sql(`insert into private.app_users(username,pass_hash,nombre,bar) values('${user}','fixture','Fixture','Fixture');
    insert into private.sessions(username) values('${user}'),('${user}');`);
  const [tokens] = await sql(`select json_agg(token order by token) from private.sessions where username='${user}';`);
  const [created] = await sql(`insert into private.surveys(question,kind,options,audience,status)
    values('Concurrent question','single','[{"id":"a","label":"A"},{"id":"b","label":"B"}]','all','active') returning json_build_object('id',id);`);
  survey = created.id;
  const results = await Promise.all(tokens.map((token,index) => sql(`begin;
    select public.app_answer_survey('${token}'::uuid,'${survey}'::uuid,'["${index ? 'b' : 'a'}"]'::jsonb);
    select pg_sleep(0.3); commit;`)));
  assert.equal(results.filter(([r]) => r.ok && !r.duplicate).length,1,'Exactly one device inserts an answer');
  assert.equal(results.filter(([r]) => r.ok && r.duplicate).length,1,'The other device is an idempotent retry');
  const [summary] = await sql(`select json_build_object('total',count(*)) from private.survey_responses where survey_id='${survey}';`);
  assert.equal(summary.total,1,'Results must count this customer once');
  for (const token of tokens) {
    const [pending] = await sql(`select public.app_pending_surveys('${token}'::uuid);`);
    assert.equal(pending.surveys.some(s => s.id === survey),false,'Answered question disappears on both devices');
  }
  console.log('Concurrent survey responses: one answer, one participant, no duplicate');
} finally {
  if (survey) {
    await sql(`delete from private.survey_responses where survey_id='${survey}'; delete from private.surveys where id='${survey}';`);
  }
  await sql(`delete from private.app_users where username='${user}';`);
}
