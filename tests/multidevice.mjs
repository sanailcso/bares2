// Run only against the disposable PostgreSQL service in CI.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
if(process.env.TIKITAKA_DB_TESTS!=='1') throw new Error('This test requires a disposable database and TIKITAKA_DB_TESTS=1');
const exec=promisify(execFile);
async function sql(query){const {stdout}=await exec('psql',['-h','localhost','-U','postgres','-d','postgres','-AtqX','-v','ON_ERROR_STOP=1','-c',query]);return stdout.split(/\r?\n/).filter(line=>line.startsWith('{')||line.startsWith('[')).map(line=>JSON.parse(line));}
const user='multidevice_fixture';
await sql(`insert into private.app_users(username,pass_hash,nombre,bar) values('${user}','fixture','Fixture','Fixture'); insert into private.players(username) values('${user}'); insert into private.sessions(username) values('${user}'),('${user}');`);
try{
  const [tokens]=await sql(`select json_agg(token order by token) from private.sessions where username='${user}';`);
  const [a,b]=await Promise.all(tokens.map(token=>sql(`begin; select public.app_spin('${token}'::uuid); select pg_sleep(0.5); commit;`)));
  const results=[a[0],b[0]];
  assert.equal(results.filter(r=>r.ok===true).length,1,'Two devices must share exactly one accepted daily spin');
  assert.equal(results.filter(r=>r.error==='already').length,1,'The concurrent second device must be rejected');
  const [summary]=await sql(`select json_build_object('spins',count(*),'points',sum(delta)) from private.events where username='${user}' and type='spin';`);
  assert.equal(summary.spins,1,'Only one spin event may be recorded');
  const winner=results.find(r=>r.ok);
  assert.equal(summary.points,winner.points,'Only the accepted spin awards points');
  const [state]=await sql(`select private.player_state('${user}');`);
  assert.equal(state.points,winner.points);
  assert.ok(state.betSpins>=1&&state.betSpins<=3,'Roulette spins may be awarded only once');
  console.log('Dos dispositivos simultáneos: una sola tirada aceptada');
}finally{
  await sql(`delete from private.events where username='${user}'; delete from private.app_users where username='${user}';`);
}
