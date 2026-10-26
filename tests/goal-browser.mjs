import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/sw.js'){res.writeHead(404);res.end();return;}
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    let data=await fs.readFile(file);
    if(url.pathname==='/assets/app.js')data=Buffer.from(data.toString().replace('var SB_ON=!!(SB_URL && SB_KEY);','var SB_ON=false;'));
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const login=async()=>{await page.getByPlaceholder('Tu usuario',{exact:true}).fill('demo');await page.getByPlaceholder('Tu contraseña',{exact:true}).fill('demo');await page.getByRole('button',{name:'Entrar al club'}).click();await page.locator('#clubGoalName').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#clubGoalSelect')?.value===document.querySelector('#clubGoalName')?.textContent);};
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await login();
  async function reelSnapshot(){return page.locator('.reels .strip').evaluateAll(strips=>strips.map(s=>({html:s.innerHTML,transform:s.style.transform}))); }
  const idleReels=await reelSnapshot();
  // Exercise the real periodic sync and return-to-app paths without waiting in real time.
  await page.clock.install();
  await page.clock.fastForward(76000);
  await page.evaluate(()=>{
    const token=_CRED.t;SB_SECURE=true;_CRED.t='idle-fixture';
    const rpc=window.sbRpc;
    window.sbRpc=async name=>name==='app_state'?{ok:true,points:state.points,streak:state.streak,lastSpin:state.lastSpin,betSpins:state.betSpins}:null;
    refreshPlayer();
    document.dispatchEvent(new Event('visibilitychange'));
    window.__idleRestore=()=>{window.sbRpc=rpc;_CRED.t=token;SB_SECURE=false;};
  });
  await page.waitForTimeout(50);
  await page.evaluate(()=>{window.__idleRestore();delete window.__idleRestore;renderSpinState();});
  assert.deepEqual(await reelSnapshot(),idleReels,'Idle timers and returning to the app preserve every visible symbol');
  await page.clock.resume();
  assert.equal(await page.locator('.club-header-kicker').innerText(),'TIKI TAKA · TU CLUB');
  assert.equal(await page.locator('#clubBrandHome img').count(),0,'Editorial header uses type instead of the square logo');
  assert.equal(await page.locator('#clubHeaderBar').getAttribute('title'),await page.locator('#clubHeaderBar').innerText());
  await page.waitForTimeout(350);
  await page.screenshot({path:'test-results/editorial-header-home.png'});
  const savedSession=await page.evaluate(()=>localStorage.getItem('tikitaka_session'));
  const longBar='Bar Tiki Taka Elche · Avenida de la Libertad';
  await page.setViewportSize({width:320,height:640});
  await page.evaluate(bar=>{const session=JSON.parse(localStorage.getItem('tikitaka_session')||'{}');session.bar=bar;localStorage.setItem('tikitaka_session',JSON.stringify(session));render();},longBar);
  await page.waitForFunction(bar=>document.getElementById('clubHeaderBar').textContent===bar,longBar);
  const headerGeometry=await page.evaluate(()=>{
    const name=document.getElementById('clubHeaderBar').getBoundingClientRect(),avatar=document.getElementById('clubProfile').getBoundingClientRect();
    return {right:name.right,avatar:avatar.left,overflow:document.documentElement.scrollWidth>innerWidth,height:document.querySelector('.app-head').getBoundingClientRect().height};
  });
  assert.ok(headerGeometry.right<headerGeometry.avatar,'Long names leave space for profile');
  assert.equal(headerGeometry.overflow,false);assert.equal(headerGeometry.height,60);
  assert.equal(await page.locator('#clubHeaderBar').getAttribute('title'),longBar,'Full bar name remains available');
  await page.screenshot({path:'test-results/editorial-header-long-name.png'});
  await page.evaluate(saved=>{if(saved===null)localStorage.removeItem('tikitaka_session');else localStorage.setItem('tikitaka_session',saved);render();},savedSession);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#clubProfile').click();
  assert.equal(await page.locator('#userNavBottom [data-nav="mibar"]').getAttribute('aria-current'),'page','Profile keeps opening the account');
  await page.locator('#clubBrandHome').click();
  assert.equal(await page.locator('#userNavBottom [data-nav="inicio"]').getAttribute('aria-current'),'page','Brand signature keeps returning Home');
  async function assertDock(){
    const geometry=await page.evaluate(()=>{
      const wallet=document.querySelector('.balance-wrap'),nav=document.querySelector('#userNavBottom');
      const b=wallet.getBoundingClientRect(),n=nav.getBoundingClientRect(),s=getComputedStyle(wallet);
      return {gap:n.top-b.bottom,left:b.left-n.left,width:b.width-n.width,position:s.position,background:s.backgroundColor,radius:s.borderTopLeftRadius,parent:wallet.parentElement.id};
    });
    assert.equal(geometry.parent,'clubBottomDock');
    assert.ok(Math.abs(geometry.gap)<1,'Balance touches the navigation with no floating gap');
    assert.ok(Math.abs(geometry.left)<1&&Math.abs(geometry.width)<1,'Balance aligns with full navigation width');
    assert.equal(geometry.position,'relative','Balance is part of the dock layout');
    assert.equal(geometry.background,'rgba(255, 250, 245, 0.72)');
    assert.equal(geometry.radius,'18px');
  }
  await assertDock();
  const first=await page.locator('#clubGoalName').innerText();
  const cdp=await context.newCDPSession(page);
  async function swipe(dx,dy=0){
    const b=await page.locator('#clubGoal').boundingBox();
    const x=dx<0?b.x+b.width-25:b.x+25,y=b.y+60;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await swipe(-120);
  await page.waitForFunction(name=>document.querySelector('#clubGoalName').textContent!==name,first);
  const next=await page.locator('#clubGoalName').innerText();
  assert.equal(await page.locator('#clubGoalSelect').inputValue(),next,'Swipe updates selected objective too');
  await swipe(120);
  assert.equal(await page.locator('#clubGoalName').innerText(),first,'Right swipe returns to previous reward');
  await swipe(2,-80);
  assert.equal(await page.locator('#clubGoalName').innerText(),first,'Vertical scroll does not change objective');
  await page.getByRole('button',{name:'Premio siguiente',exact:true}).click();
  assert.equal(await page.locator('#clubGoalName').innerText(),next);
  await page.reload();await login();
  assert.equal(await page.locator('#clubGoalName').innerText(),next,'Objective survives reload');
  await page.locator('#clubGoal').focus();await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#clubGoalName').innerText(),first,'Keyboard navigation works');
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Premios',exact:true}).click();
  await page.locator('#clubBottomDock>.balance-wrap').waitFor({state:'hidden'});
  await page.locator('#catalog .reward .r-img').first().waitFor({state:'visible'});
  for (const width of [320,390,560]) {
    await page.setViewportSize({width,height:844});
    const photos=await page.locator('#catalog .r-emoji').evaluateAll(frames=>frames.filter(f=>f.querySelector('img,svg')).map(f=>{
      const b=f.getBoundingClientRect(),image=f.querySelector('img,svg'),r=image.getBoundingClientRect();
      return {width:b.width,height:b.height,imageWidth:r.width,imageHeight:r.height,loaded:image.tagName.toLowerCase()!=='img'||(image.complete&&image.naturalWidth>0)};
    }));
    assert.ok(photos.length>0);
    for(const photo of photos){
      assert.ok(photo.width>80&&photo.height>60,'Photo frame must not collapse: '+JSON.stringify(photo));
      assert.ok(photo.imageWidth>80&&photo.imageHeight>60,'Product has a visible size');
      assert.ok(photo.loaded,'Product image loaded');
      assert.ok(Math.abs(photo.width/photo.height-4/3)<.02,'Frame retains 4:3 proportions');
    }
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#catalog .reward .r-img').first().evaluate(e=>getComputedStyle(e).objectFit),'contain','Catalog preserves complete product');
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'No horizontal overflow at '+width);
  }
  assert.deepEqual(errors,[]);
  await fs.mkdir('test-results',{recursive:true});
  await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.locator('#clubGoal').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/goal-mobile.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Jugar',exact:true}).click();
  await page.locator('#clubBottomDock>.balance-wrap').waitFor({state:'visible'});
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});
    await page.mouse.wheel(0,400);
    await assertDock();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
  }
  async function assertGameEndClear(game){
    for(const [width,height] of [[390,844],[320,640],[390,568]]){
      await page.setViewportSize({width,height});
      await page.evaluate(async()=>{
        await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
        window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
        await new Promise(requestAnimationFrame);
      });
      const layout=await page.evaluate(()=>{
        const panel=document.querySelector('#tab-jugar'),dock=document.querySelector('#clubBottomDock');
        return {end:panel.getBoundingClientRect().bottom,dockTop:dock.getBoundingClientRect().top,
          dockHeight:dock.getBoundingClientRect().height,padding:parseFloat(getComputedStyle(document.querySelector('#appCard')).paddingBottom)};
      });
      assert.ok(layout.padding>=layout.dockHeight+23,'Reserve entire bottom dock: '+JSON.stringify(layout));
      assert.ok(layout.end<=layout.dockTop-16,game+' final content clears dock at '+width+'x'+height+': '+JSON.stringify(layout));
    }
  }
  await assertGameEndClear('Rodillos');
  await page.screenshot({path:'test-results/points-docked-mobile.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Mi bar',exact:true}).click();
  await page.locator('#demoRuleta').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Jugar',exact:true}).click();
  await page.locator('#betGo').waitFor({state:'visible'});
  await assertGameEndClear('Ruleta');
  await page.screenshot({path:'test-results/roulette-end-visible.png'});
  // A single click in Home navigates and starts exactly one real offline demo spin.
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.evaluate(()=>{
    setGame('slot');state.lastSpin=null;state.streak=0;state.pendingBox=false;state.goldenRound=false;renderSpinState();
    localStorage.setItem('tikitaka_notif_later_'+currentUser,String(Date.now()+86400000));
    document.getElementById('clubGame').dataset.entryProbe='same-node';
    window.__entrySpinCalls=0;const original=window.secureSpin;
    window.secureSpin=function(){window.__entrySpinCalls++;return original.apply(this,arguments);};
  });
  await page.locator('#spinBtn').click();
  assert.equal(await page.locator('#userNavBottom [data-nav="jugar"]').getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#clubGame').evaluate(e=>e.parentElement.id),'clubPlayGame');
  assert.equal(await page.locator('#clubGame').getAttribute('data-entry-probe'),'same-node','Reuse the active game');
  assert.equal(await page.locator('#tab-jugar').evaluate(e=>getComputedStyle(e).animationName),'none','No tab fade during game entry');
  await page.waitForFunction(()=>!spinning);
  assert.equal(await page.evaluate(()=>window.__entrySpinCalls),1,'One click starts only one spin');
  const settledReels=await reelSnapshot();
  await page.evaluate(()=>{renderSpinState();renderSpinState();});
  assert.deepEqual(await reelSnapshot(),settledReels,'Refreshing after a real spin preserves the entire settled combination');
  assert.equal(await page.evaluate(()=>state.lastSpin),await page.evaluate(()=>todayStr()));
  assert.equal(await page.evaluate(()=>{const h=state.history.find(h=>h.type==='spin');return h.after-h.before===h.delta;}),true,'Real spin records before and after balances');
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.evaluate(()=>{state.betSpins=3;_serverSpins=3;setGame('slot');renderRuletaCta();});
  await page.locator('#rcGo').click();
  await page.locator('#betWheel').waitFor({state:'visible'});
  assert.equal(await page.locator('#userNavBottom [data-nav="jugar"]').getAttribute('aria-current'),'page','Roulette entry also opens Play');
  assert.equal(await page.evaluate(()=>window.__entrySpinCalls),1,'Navigation does not replay the spin');
  // Confirmed point changes attract attention and overlapping counters settle correctly.
  await page.waitForTimeout(3800);
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.evaluate(()=>{state.points=1200;countUp(document.getElementById('balance'),0,1200,900);});
  await page.waitForFunction(()=>{const n=Number(document.getElementById('balance').textContent.replace(/\D/g,''));return n>0&&n<1200;});
  assert.equal(await page.locator('#clubGameGain').innerText(),'+1200 puntos');
  assert.equal(await page.locator('.club-wallet').evaluate(e=>e.classList.contains('is-gaining')),true);
  assert.equal(await page.locator('#balance').evaluate(e=>getComputedStyle(e).animationName),'club-points-zoom');
  await page.screenshot({path:'test-results/points-gain-mobile.png'});
  // A newer change must cancel the previous animation, even if it was longer.
  await page.evaluate(()=>{countUp(document.getElementById('balance'),1200,5000,3500);state.points=750;countUp(document.getElementById('balance'),1200,750,700);});
  assert.equal(await page.locator('#clubGameGain').innerText(),'−450 puntos');
  await page.waitForFunction(()=>document.getElementById('balance').textContent==='750');
  await page.waitForTimeout(3900);
  assert.equal(await page.locator('#balance').innerText(),'750','An older counter cannot overwrite a newer balance');
  assert.equal(await page.locator('#clubHomeBalance').innerText(),'750');
  assert.equal(await page.locator('#clubGameGain').innerText(),'');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Premios',exact:true}).click();
  await page.evaluate(()=>{state.points=800;countUp(document.getElementById('balance'),750,800,900);});
  await page.locator('#clubBottomDock>.balance-wrap').waitFor({state:'visible'});
  assert.equal(await page.locator('#balance').innerText(),'800','Reduced motion shows final balance immediately');
  assert.equal(await page.locator('#balance').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await page.locator('#clubGameGain').innerText(),'+50 puntos');
  await page.waitForTimeout(3300);
  await page.locator('#clubBottomDock>.balance-wrap').waitFor({state:'hidden'});
  await page.evaluate(()=>countUp(document.getElementById('balance'),800,800,900));
  assert.equal(await page.locator('#clubGameGain').innerText(),'','Unchanged balances do not trigger a reward');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Mi bar',exact:true}).click();
  await page.locator('#demoReset').click();
  for(let day=1;day<=7;day++){
    await page.locator('#demoStreak').click();
    await page.waitForFunction(day=>state.streak===day&&!_demoBusy,day);
  }
  await page.locator('#boxPop').waitFor({state:'visible'});
  assert.equal(await page.locator('#boxPop').evaluate(e=>e.matches(':modal')),true,'Pending box opens above navigation automatically');
  assert.equal(await page.locator('#boxRow button').count(),3);
  assert.equal(await page.locator('#boxPop').getAttribute('aria-hidden'),'false');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#boxRow img')).every(i=>i.complete&&i.naturalWidth>0));
  for(const width of [320,390,900]){
    await page.setViewportSize({width,height:700});
    assert.equal(await page.locator('#boxPop').evaluate(e=>e.scrollWidth>e.clientWidth),false,'Boxes fit the viewport');
  }
  await page.screenshot({path:'test-results/surprise-box-premium.png'});
  await page.locator('#boxLater').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.locator('#clubOpenBox').waitFor({state:'visible'});
  await page.locator('#clubOpenBox').click();
  await page.locator('#boxPop').waitFor({state:'visible'});
  // Reload with a pending box: it must present itself without using demo controls.
  await page.reload();await login();
  await page.locator('#boxPop').waitFor({state:'visible'});
  const beforeBox=await page.evaluate(()=>state.points);
  await page.locator('#boxRow button').first().click();
  await page.evaluate(()=>claimBox(0));
  const afterBox=await page.evaluate(()=>({points:state.points,pending:state.pendingBox,streak:state.streak,awards:state.history.filter(e=>e.label.includes('Caja sorpresa')).length}));
  assert.ok([70,90,110].includes(afterBox.points-beforeBox));
  assert.equal(afterBox.pending,false);assert.equal(afterBox.streak,0);assert.equal(afterBox.awards,1,'A double claim awards only once');
  await page.locator('#boxPop').waitFor({state:'hidden'});
  assert.equal(await page.locator('#clubOpenBox').isVisible(),false);
  await page.reload();await login();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('#boxPop').isVisible(),false,'Claimed box does not reopen');
  // History must display stored snapshots, not reconstruct them from today's balance.
  await page.evaluate(()=>{
    state.history=[{type:'bet',date:todayStr(),label:'Ruleta de prueba',delta:150,before:1000,after:1150},
      {type:'spin',date:todayStr(),label:'Registro antiguo',delta:100}];
    state.points=9999;renderHistory();
  });
  assert.match(await page.locator('#history').textContent(),/Antes.*1000 pts.*Después.*1150 pts/s);
  assert.match(await page.locator('#history').textContent(),/Saldo no registrado/);
  await page.evaluate(()=>{state.points=10000;renderHistory();});
  assert.match(await page.locator('#history').textContent(),/Antes.*1000 pts.*Después.*1150 pts/s);
  await page.evaluate(()=>window.dispatchEvent(new Event('pointermove')));
  await page.locator('#userNavBottom').getByRole('button',{name:'Jugar',exact:true}).click();
  await page.evaluate(()=>{document.activeElement.blur();});
  await page.waitForFunction(()=>document.body.classList.contains('club-nav-idle'));
  assert.equal(await page.locator('#userNavBottom').evaluate(e=>e.inert),true);
  assert.equal(await page.locator('#clubBottomDock>.balance-wrap').isVisible(),true,'Only navigation hides');
  await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch'})));
  await page.waitForTimeout(2500);
  assert.equal(await page.locator('#userNavBottom').evaluate(e=>e.inert),false,'Navigation stays visible while touching');
  await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch'})));
  await page.waitForTimeout(250);
  assert.ok(await page.locator('#clubBottomDock>.balance-wrap').evaluate(e=>e.getBoundingClientRect().height<=42),'Wallet is 30% shorter');
  await page.evaluate(()=>window.scrollTo({top:300,behavior:'instant'}));
  await page.waitForTimeout(100);
  assert.ok(await page.locator('.app-head').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<2),'Brand stays visible on scroll');
  await page.evaluate(()=>{countUp(document.getElementById('balance'),100,250,2000);});
  await page.locator('.club-neon-ring').waitFor({state:'visible'});
  assert.equal(await page.locator('.club-neon-ring').evaluate(e=>getComputedStyle(e,':before').animationName),'club-neon-orbit');
  await page.waitForTimeout(2000);
  const halfway=await page.locator('#balance').innerText();
  assert.ok(Number(halfway)>100&&Number(halfway)<220,'Gains are still climbing steadily after two seconds');
  assert.equal(await page.locator('.club-neon-ring').isVisible(),true,'Neon remains active throughout the longer gain');
  await page.waitForFunction(()=>document.getElementById('balance').textContent==='250');
  await page.locator('.club-neon-ring').waitFor({state:'hidden'});
  assert.equal(await page.locator('#balance').innerText(),'250','Longer animation finishes at the exact balance');
  for(const golden of [false,true]){
    for(const [width,height] of [[390,844],[320,640],[390,568],[900,900]]){
      await page.setViewportSize({width,height});
      await page.evaluate(golden=>{state.goldenRound=golden;state.betSpins=3;_serverSpins=3;setGame('bet');window.dispatchEvent(new Event('pointermove'));},golden);
      await page.waitForTimeout(350);
      const fit=await page.evaluate(()=>{
        const button=document.getElementById('betGo').getBoundingClientRect();
        const wheel=document.querySelector('#clubGame .bet-wheel-wrap').getBoundingClientRect();
        return {bottom:button.bottom,top:button.top,dock:document.getElementById('clubBottomDock').getBoundingClientRect().top,
          wheelTop:wheel.top,header:document.querySelector('.app-head').getBoundingClientRect().bottom,viewport:innerHeight,scroll:scrollY};
      });
      assert.ok(fit.bottom<=Math.min(fit.dock,fit.viewport)-2&&fit.top>=fit.header,'Roulette action fits without scrolling '+width+'x'+height+' golden='+golden+': '+JSON.stringify(fit));
      assert.ok(fit.wheelTop>=fit.header&&fit.scroll===0,'Whole roulette starts below the brand');
      if(width===390&&height===568)await page.screenshot({path:'test-results/compact-roulette-'+(golden?'golden':'normal')+'.png'});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('Touch goals, mobile catalog and transparent balance joined to navigation passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

