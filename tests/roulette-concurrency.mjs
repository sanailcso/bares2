import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
if(process.env.TIKITAKA_DB_TESTS!=='1') throw new Error('Requires the disposable CI database');
const exec=promisify(execFile),user='roulette_race_fixture';
async function sql(query){const {stdout}=await exec('psql',['-h','localhost','-U','postgres','-d','postgres','-AtqX','-v','ON_ERROR_STOP=1','-c',query]);return stdout.split(/\r?\n/).filter(l=>l.startsWith('{')||l.startsWith('[')).map(l=>JSON.parse(l));}
await sql(`insert into private.app_users(username,pass_hash,nombre,bar) values('${user}','fixture','Fixture','Fixture'); insert into private.players(username,points,bet_spins) values('${user}',1000,1); insert into private.sessions(username) values('${user}'),('${user}');`);
try{
 const [tokens]=await sql(`select json_agg(token order by token) from private.sessions where username='${user}';`);
 const results=await Promise.all(tokens.map(t=>sql(`begin; select public.app_bet('${t}'::uuid,100); select pg_sleep(0.3); commit;`)));
 assert.equal(results.filter(([r])=>r.ok).length,1,'Only one device can spend the last credit');
 assert.equal(results.filter(([r])=>r.error==='limit'&&r.betSpins===0).length,1,'Other device receives the confirmed zero balance');
 const [summary]=await sql(`select json_build_object('events',count(*),'delta',sum(delta)) from private.events where username='${user}' and type='bet';`);
 const [state]=await sql(`select private.player_state('${user}');`);
 assert.equal(summary.events,1);assert.equal(state.betSpins,0);assert.equal(state.points,1000+summary.delta);
 console.log('Two devices, one roulette credit: one result and one accounting event');
}finally{await sql(`delete from private.events where username='${user}'; delete from private.app_users where username='${user}';`);}
