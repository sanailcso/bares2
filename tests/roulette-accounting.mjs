import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const start=source.indexOf('  function placeBet('),end=source.indexOf('  function refreshPlayer(',start);
async function run(reply,mult=2,points=1000){
  const timers=[],changes=[],elements={};
  const element=()=>({style:{},classList:{add(){},remove(){}},disabled:false,textContent:'',innerHTML:''});
  const scope={_betBusy:false,_demoBusy:false,_configReady:true,_betRot:0,state:{points,betSpins:2,history:[]},
    activeBetCfg:()=>({min:100,max:1000,segments:[{mult,w:1}]}),betConfigError:()=>'',betSpinsLeft:()=>scope.state.betSpins,
    document:{getElementById:id=>elements[id]||(elements[id]=element())},saveState(){},renderOnboarding(){},playRouletteAudio(){},
    wheelLayout:()=>[mult],secureBet:async()=>reply,localBetPick:()=>mult,countUp:(_,from,to)=>changes.push([from,to]),balance:{},
    setTimeout:fn=>timers.push(fn),todayStr:()=> '2026-10-22',renderCatalog(){},renderHistory(){},launchConfetti(){},chime(){},setGame(){},forceLogout(){}};
  vm.createContext(scope);vm.runInContext(source.slice(start,end),scope);
  scope.placeBet(300);await new Promise(r=>setImmediate(r));
  return {scope,timers,changes,elements};
}
for(const mult of [1,1.5,2,3]){
  for(const server of [false,true]){
    const prize=Math.floor(300*mult),final=700+prize;
    const r=await run(server?{ok:true,mult,points:final,afterStake:700,gain:prize,betSpins:1}:null,mult);
    assert.equal(r.scope.state.points,700,'Stake is visible before the result');
    assert.equal(r.scope._betBusy,true);r.timers.shift()();
    assert.equal(r.scope.state.points,final);assert.equal(r.scope.state.history[0].delta,prize-300);
    assert.deepEqual(r.changes,[[1000,700],[700,final]]);
    assert.equal(r.scope.state.betSpins,1);
  }
}
const poor=await run(null,2,299);assert.equal(poor.scope.state.points,299);assert.equal(poor.timers.length,0);
const offline=await run({ok:false,error:'offline'});assert.equal(offline.scope.state.points,1000);assert.equal(offline.scope.state.betSpins,2);
const rejected=await run({ok:false,error:'funds',points:200});assert.equal(rejected.scope.state.points,200);assert.equal(rejected.scope.state.betSpins,2);
console.log('Roulette accounting: debit, payout, net history and rejection scenarios passed');
