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
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.locator('#clubGoal').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/goal-mobile.png'});
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
  await page.locator('#userNavBottom').getByRole('button',{name:'Mi bar',exact:true}).click();
  await page.locator('#demoRuleta').click();
  await page.locator('#userNavBottom').getByRole('button',{name:'Jugar',exact:true}).click();
  await page.locator('#betGo').waitFor({state:'visible'});
  await assertGameEndClear('Ruleta');
  await page.screenshot({path:'test-results/roulette-end-visible.png'});
  // A single click in Home navigates and starts exactly one real offline demo spin.
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
  assert.equal(await page.evaluate(()=>state.lastSpin),await page.evaluate(()=>todayStr()));
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.evaluate(()=>{state.betSpins=3;_serverSpins=3;setGame('slot');renderRuletaCta();});
  await page.locator('#rcGo').click();
  await page.locator('#betWheel').waitFor({state:'visible'});
  assert.equal(await page.locator('#userNavBottom [data-nav="jugar"]').getAttribute('aria-current'),'page','Roulette entry also opens Play');
  assert.equal(await page.evaluate(()=>window.__entrySpinCalls),1,'Navigation does not replay the spin');
  // Confirmed point changes attract attention and overlapping counters settle correctly.
  await page.waitForTimeout(3800);
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
  await page.waitForTimeout(2900);
  assert.equal(await page.locator('#balance').innerText(),'750','An older counter cannot overwrite a newer balance');
  assert.equal(await page.locator('#clubHomeBalance').innerText(),'750');
  assert.equal(await page.locator('#clubGameGain').innerText(),'');
  await page.emulateMedia({reducedMotion:'reduce'});
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
  assert.deepEqual(errors,[]);
  console.log('Touch goals, mobile catalog and transparent balance joined to navigation passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

