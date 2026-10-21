import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const start=source.indexOf('  function demoAction('),end=source.indexOf('  [["demoDay"',start);
assert.ok(start>=0&&end>start);
function fixture(){
  let calls=0; const buttons=[{disabled:false}];
  const s={currentUser:'demo',state:{points:10,streak:1,betSpins:0},_demoBusy:false,_demoRevision:0,spinning:false,_betBusy:false,
    _CRED:{t:'fixture'},SB_ON:true,SB_SECURE:true,Promise,Error,Object,document:{querySelectorAll:()=>buttons},
    sbRpc:async(name,args)=>{calls++;assert.equal(name,'app_demo_action');assert.equal(args.p_token,'fixture');return {ok:true,state:{points:20010,streak:1,betSpins:0}};},
    balance:{},saveState(){},render(){},countUp(){},setGame(){},toast(){},defaultState:()=>({points:0,streak:0,betSpins:0})};
  vm.createContext(s); vm.runInContext(source.slice(start,end),s);
  return {s,buttons,calls:()=>calls};
}
const customer=fixture();customer.s.currentUser='bar';assert.equal(await customer.s.demoAction('points'),false);assert.equal(customer.calls(),0);
const online=fixture();assert.equal(await online.s.demoAction('points'),true);assert.equal(online.s.state.points,20010);assert.equal(online.buttons[0].disabled,false);
const failed=fixture();failed.s.sbRpc=async()=>({ok:false,error:'demo_only'});assert.equal(await failed.s.demoAction('points'),false);assert.equal(failed.s.state.points,10,'Server rejection cannot award local fallback points');assert.equal(failed.buttons[0].disabled,false);
const pending=fixture();let finish;pending.s.sbRpc=()=>new Promise(resolve=>{finish=resolve;});const first=pending.s.demoAction('points');assert.equal(await pending.s.demoAction('reset'),false,'Concurrent tools are blocked');pending.s.currentUser='other';finish({ok:true,state:{points:20010}});assert.equal(await first,false);assert.equal(pending.s.state.points,10,'A result cannot affect a different login');
console.log('Controles demo: autorización, saldo confirmado y aislamiento de sesión superados');
