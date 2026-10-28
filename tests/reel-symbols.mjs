import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const art={jackpot:'./current-j.webp',prize:'./current-p.webp',fillers:['./f0.webp','./f1.webp','./f2.webp','./f3.webp']};
const strips=Array.from({length:5},()=>({style:{},innerHTML:''}));
let draws=0;
const scope={CUR_SYM:art,DEFAULT_SYM:art,ALL_SYMBOLS:[...art.fillers,art.jackpot,art.prize],reels:strips.map(s=>({querySelector:()=>s})),
 rand:values=>{draws++;return values[0];},symbolMarkup:value=>'<span>'+value+'</span>',refreshSymbols(){},
 SB_ON:true,_playerStateReady:true,_configReady:false,spinning:false,currentUser:'alice',PREVIEW_CFG:null,
 state:{lastSymbols:['./retired.webp','OLD',null,{},'OLD'],points:123},
 spinBtn:{},spinNote:{},spunToday:()=>false,pararCuenta(){},bloquearRodillos(){},winBanner:{classList:{remove(){}}}};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('  function symFromCode('),source.indexOf('  /* ===== Cuenta atras')),scope);
const clean=value=>JSON.parse(JSON.stringify(value));
assert.deepEqual(clean(scope.initialReelSymbols(['J','P',0,'1',3])),[art.jackpot,art.prize,art.fillers[0],art.fillers[1],art.fillers[3]]);
assert.deepEqual(clean(scope.initialReelSymbols(art.fillers.concat([art.jackpot]))),art.fillers.concat([art.jackpot]),'Still-active saved artwork is preserved');
assert.deepEqual(clean(scope.initialReelSymbols(['OLD','OLD','OLD','OLD','OLD'])),[art.jackpot,art.fillers[0],art.prize,art.fillers[1],art.jackpot]);
assert.deepEqual(clean(scope.reelSymbolCodes([art.jackpot,art.fillers[0],art.prize,art.fillers[1],art.jackpot])),['J',0,'P',1,'J']);
vm.runInContext(source.slice(source.indexOf('  function renderSpinState('),source.indexOf('  /* ===== Premios de la tirada diaria')),scope);
scope.renderSpinState();assert.equal(draws,0,'No fallback artwork is painted before public config arrives');assert.equal(scope.spinBtn.disabled,true);
scope._configReady=true;scope.renderSpinState();
assert.equal(draws,10);assert.ok(strips.every(s=>!s.innerHTML.includes('retired')&&!s.innerHTML.includes('OLD')));
assert.equal(scope.state.points,123,'Artwork normalization never changes points');
const frozen=JSON.stringify(strips);scope.renderSpinState();assert.equal(draws,10);assert.equal(JSON.stringify(strips),frozen,'Idle refresh does not redraw the reels');

const storage=new Map();
const choice={currentUser:'alice',_betStakeChoice:{user:null,mode:'manual',amount:null},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
vm.createContext(choice);vm.runInContext(source.slice(source.indexOf('  function loadBetStakeChoice('),source.indexOf('  function renderBet(')),choice);
const config={min:10,max:300};
choice.rememberBetStake('max',null);assert.equal(choice.preferredBetStake(config,60),60);assert.equal(choice.preferredBetStake(config,90),90);assert.equal(choice.preferredBetStake(config,500),300);
choice._betStakeChoice={user:null,mode:'manual',amount:null};assert.equal(choice.preferredBetStake(config,80),80,'Remember MAX after reloading the preference');
choice.currentUser='bob';assert.equal(choice.preferredBetStake(config,80),10,'Other accounts do not inherit MAX');
choice.rememberBetStake('manual',25);assert.equal(choice.preferredBetStake(config,80),25);
choice.currentUser='alice';assert.equal(choice.preferredBetStake(config,80),80);
choice.rememberBetStake('manual',40);assert.equal(choice.preferredBetStake(config,200),40,'A deliberate manual amount exits MAX');
console.log('Current reel artwork, cold-start config, stable idle reels and per-account MAX preferences passed');
