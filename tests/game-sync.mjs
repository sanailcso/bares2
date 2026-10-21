import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
function fn(name,next){const start=source.indexOf('  function '+name+'('),end=source.indexOf('  function '+next+'(',start); assert.ok(start>=0&&end>start);return source.slice(start,end);}
const stored={points:0,lastSpin:null,betSpins:0};
const rpcCalls=[];
function client(){
  const scope={SB_ON:true,SB_SECURE:true,_CRED:{u:'demo',t:'server-token'},currentUser:'demo',Promise,Number,
    sbRpc:async(name,args)=>{
      rpcCalls.push(name);
      if(name==='app_spin'){
        if(stored.lastSpin==='2026-10-21')return {ok:false,error:'already'};
        Object.assign(stored,{lastSpin:'2026-10-21',points:stored.points+20,betSpins:stored.betSpins+2});
        return {ok:true,...stored};
      }
      if(name==='app_bet')return {ok:true,mult:2,points:stored.points+2*args.p_stake};
    }};
  vm.createContext(scope);vm.runInContext(fn('secureSpin','secureRedeem')+fn('secureBet','renderBet'),scope);return scope;
}
const first=client();assert.equal((await first.secureSpin()).ok,true);
const reloaded=client();assert.equal((await reloaded.secureSpin()).error,'already');
assert.equal(stored.points,20,'Reload must not award points again');
assert.equal((await reloaded.secureBet(100)).mult,2,'Connected demo uses server roulette too');
assert.deepEqual(rpcCalls,['app_spin','app_spin','app_bet']);
reloaded.SB_SECURE=false;assert.equal((await reloaded.secureBet(100)).error,'offline','No local outcome on production auth failure');
reloaded.SB_ON=false;assert.equal(await reloaded.secureSpin(),null,'Only the isolated preview permits a local result');

const math={Number,Promise,Date,Intl,_fmtMadridYmd:new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}),ymd:()=>{throw Error('unexpected date fallback');}};
vm.createContext(math);vm.runInContext(fn('ymdMadrid','todayStr')+fn('betConfigError','configSaveError')+fn('wheelLayout','activeBetCfg'),math);
assert.equal(math.ymdMadrid(Date.parse('2026-10-20T22:01:00Z')),'2026-10-21');
assert.equal(math.ymdMadrid(Date.parse('2026-10-25T23:01:00Z')),'2026-10-26','DST boundary follows Madrid');
assert.equal(math.betConfigError({segments:[{mult:1.5,w:1},{mult:2,w:1}]}),'','Positive prize average above x1 is allowed');
assert.notEqual(math.betConfigError({segments:[{mult:0,w:1},{mult:0.5,w:1}]}),'');
assert.notEqual(math.betConfigError({segments:[{mult:1,w:0},{mult:2,w:0}]}),'');
assert.deepEqual(Array.from(math.wheelLayout([{mult:1,w:5},{mult:2,w:0},{mult:3,w:1}])),[1,3]);

const resume={currentUser:'',localStorage:{getItem:()=>JSON.stringify({u:'demo',t:'saved-token'})},sbRpc:async()=>({ok:true,state:{...stored}}),_CRED:{},finishLogin:(...args)=>{resume.login=args;}};
vm.createContext(resume);vm.runInContext(fn('resumeSession','logout'),resume);resume.resumeSession();await new Promise(resolve=>setImmediate(resolve));
assert.equal(resume.login[3],'saved-token','Resume must preserve the token for later reloads');
assert.equal(resume.login[2].lastSpin,'2026-10-21');

const saving={SB_ON:true,SB_SECURE:true,_admPin:'fixture-pin',_configRequest:0,_configSaveQueue:Promise.resolve(),normalizeCfg:x=>x,configWithoutSecrets:x=>JSON.parse(JSON.stringify(x)),betConfigError:math.betConfigError,localStorage:{setItem(){}},sbRpc:async()=>({ok:true,rev:12})};
vm.createContext(saving);vm.runInContext(fn('sbSaveConfigNow','sbSaveConfig'),saving);
await saving.sbSaveConfigNow({bet:{segments:[{mult:1.5,w:1},{mult:2,w:1}]}});
assert.equal(saving.ACTIVE_CFG.bet.segments[1].mult,2,'Closing admin retains the acknowledged configuration');
assert.equal(saving.ACTIVE_CFG.rev,12);

let checkpoint;
const classes={add(){},remove(){}};
const animation={state:{lastSpin:'2026-10-20'},spinning:false,spunToday:()=>false,ensureAudio(){},refreshSymbols(){},spinBtn:{},winBanner:{classList:classes},document:{getElementById:()=>({classList:classes})},setTimeout(){},whir(){},secureSpin:async()=>null,todayStr:()=> '2026-10-21',saveState(){checkpoint=JSON.parse(JSON.stringify(animation.state));},rollTier:()=>20,targetFor:()=>[0,1,2,3,0],reels:Array.from({length:5},()=>({classList:classes,querySelector:()=>({style:{},children:[{getBoundingClientRect:()=>({height:50})}]})})),buildStrip:()=>20};
animation.SB_ON=false; animation._demoBusy=false;
vm.createContext(animation);vm.runInContext(fn('spin','settle'),animation);animation.spin();await new Promise(resolve=>setImmediate(resolve));
assert.equal(checkpoint.lastSpin,'2026-10-21','Consume the spin before any animation callback, so an immediate reload stays blocked');
assert.equal(checkpoint._spinPreviousDate,'2026-10-20','Preserve yesterday for streak calculation');
console.log('Tirada diaria, recarga, sesión y ruleta: comprobaciones superadas');
