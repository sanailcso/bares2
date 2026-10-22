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
  const login=async()=>{await page.getByPlaceholder('Tu usuario',{exact:true}).fill('demo');await page.getByPlaceholder('Tu contraseña',{exact:true}).fill('demo');await page.getByRole('button',{name:'Entrar al club'}).click();await page.locator('#clubGoalName').waitFor({state:'visible'});};
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
  await page.screenshot({path:'test-results/points-docked-mobile.png'});
  console.log('Touch goals, mobile catalog and transparent balance joined to navigation passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
