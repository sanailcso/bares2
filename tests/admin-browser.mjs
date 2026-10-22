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
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
let page;
try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page=await context.newPage();
  const errors=[],saves=[];
  let failSave=false;
  page.on('pageerror',e=>errors.push(e.message));
  const users=[{username:'fixture_bar',nombre:'Cliente de prueba',bar:'Bar de prueba',active:true}];
  const pending={id:'fixture-redemption',username:'fixture_bar',bar:'Bar de prueba',premio:'Llavero premium',puntos:2500,delivered:false,cancelled:false,created_at:'2026-10-22T09:00:00Z'};
  let publicConfig={rev:1,bet:{enabled:true,min:100,max:1000,perDay:3,segments:[{mult:1,w:90},{mult:2,w:10}]}};
  await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.hostname==='127.0.0.1'){await route.continue();return;}
    if(!url.hostname.endsWith('.supabase.co')){await route.abort();return;}
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'apikey,authorization,content-type','access-control-allow-methods':'POST,GET,OPTIONS'};
    if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
    const fn=url.pathname.split('/').pop(),args=req.postDataJSON()||{};
    let data={ok:true};
    if(fn==='app_public_config')data=publicConfig;
    else if(fn==='app_admin_check')data=args.p_pin==='fixture-admin';
    else if(fn==='app_admin_users')data=users;
    else if(fn==='app_admin_players')data=[{username:'fixture_bar',points:4000}];
    else if(fn==='app_admin_redemptions')data=[pending];
    else if(fn==='app_admin_save_config'){
      if(failSave)data={ok:false,error:'storage_failure'};
      else if(JSON.stringify(args.p_data).length>4194304)data={ok:false,error:'config'};
      else {saves.push(args.p_data);publicConfig=JSON.parse(JSON.stringify(args.p_data));publicConfig.rev=1;data={ok:true,rev:1};}
    }
    else if(fn==='app_login')data={ok:true,token:'00000000-0000-4000-8000-000000000001',nombre:'Demo',bar:'Demo',state:{points:0,lastSpin:null,streak:0,betSpins:0,history:[]}};
    else if(fn==='app_state')data={ok:true,points:0,lastSpin:null,streak:0,betSpins:0};
    else if(fn==='app_admin_stats')data={ok:true,players_total:1,players_active7:1,points_held:4000,points_redeemed:2500,spins_total:20,spins_today:2,bets_count:12,bets_delta:500,redeem_total:1,redeem_pending:1,revenue_total:300,revenue_30:300,points_earned30:5000,push_users:1,daily:[{d:'2026-10-21',spins:2},{d:'2026-10-22',spins:3}],top_prizes:[{name:'Llavero premium',n:1}],ts:'2026-10-22T09:00:00Z'};
    else if(fn==='app_admin_events')data=[];
    await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/#admin');
  await page.getByLabel('PIN de administrador',{exact:true}).fill('fixture-admin');
  assert.equal(await page.locator('.adm-pin').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)','PIN screen uses white card');
  await page.locator('#admPinOk').click();
  await page.getByRole('heading',{name:'Panel del club',exact:true}).waitFor();
  await page.locator('.adm-uedit[data-u="fixture_bar"]').waitFor({state:'attached'});
  assert.equal(await page.locator('#adminScreen').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(246, 244, 238)');
  assert.equal(await page.locator('.adm-menu-i').count(),14,'All admin functions remain reachable');
  const visit=async id=>{
    const button=page.locator('.adm-menu-i[data-t="'+id+'"]');
    await button.click();
    assert.equal(await button.getAttribute('aria-current'),'location');
  };
  await visit('sec-analiticas');
  await page.locator('.adm-kpi').first().waitFor({state:'visible'});
  assert.equal(await page.locator('.adm-kpi').count(),9);
  await fs.mkdir('test-results',{recursive:true});
  await page.screenshot({path:'test-results/admin-mobile-summary.png'});
  await visit('sec-premios');
  const photo=page.locator('.adm-rw-photo').first();
  await photo.selectOption('./img/club-cap.webp');
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
  assert.equal(saves.at(-1).rewards[0].image,'./img/club-cap.webp','Admin photo control still saves the chosen image');
  await visit('sec-apuesta');
  await page.locator('.adm-seg-mult').first().fill('1.5');
  await page.locator('.adm-seg-mult').first().press('Tab');
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
  assert.equal(saves.at(-1).bet.segments[0].mult,1.5,'Roulette edits still save');
  await visit('sec-clientes');
  await page.locator('.adm-uedit[data-u="fixture_bar"]').click();
  await page.locator('#pwdOverlay').waitFor({state:'visible'});
  assert.equal(await page.locator('#pwdOverlay>div').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  await page.locator('#pwdCancel').click();
  await visit('sec-canjes');
  await page.locator('.adm-canje-item').waitFor({state:'visible'});
  for(const [width,height] of [[390,844],[320,640],[1280,900]]){
    await page.setViewportSize({width,height});
    await visit('sec-premios');
    await page.locator('.adm-rw-name').first().scrollIntoViewIfNeeded();
    const bounds=await page.locator('#adminScreen').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));
    assert.ok(bounds.scroll<=bounds.client,'Admin fits '+width+'px: '+JSON.stringify(bounds));
    assert.equal(await page.locator('.adm-rw-name').first().isEditable(),true);
    await page.screenshot({path:'test-results/admin-rewards-'+width+'.png'});
  }

  // Reproduce the original failure: a high-detail PNG and seven transparent
  // symbols, with the browser's configuration cache deliberately full.
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='tikitaka_admin_cfg')throw new DOMException('Fixture quota','QuotaExceededError');
      return original.call(this,key,value);
    };
  });
  const raw=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1536;
    const ctx=canvas.getContext('2d'),image=ctx.createImageData(1536,1536);
    for(let p=0;p<image.data.length;p+=65536)crypto.getRandomValues(image.data.subarray(p,Math.min(p+65536,image.data.length)));
    for(let y=0;y<1536;y++)for(let x=0;x<1536;x++){
      const offset=(y*1536+x)*4;
      image.data[offset+3]=Math.hypot(x-768,y-768)<720?255:0;
    }
    ctx.putImageData(image,0,0);return canvas.toDataURL('image/png').split(',')[1];
  });
  const png=Buffer.from(raw,'base64');
  assert.ok(png.length>4194304,'Fixture is large enough to exceed the old cloud limit without optimization');
  const upload=(name)=>({name,mimeType:'image/png',buffer:png});
  const waitSaved=()=>page.waitForFunction(()=>document.querySelector('#admSaveState')?.dataset.state==='saved');
  await visit('sec-fondos');
  await page.locator('#admAdd').setInputFiles(upload('Fondo profesional.png'));
  await page.locator('.adm-theme[data-id="fondo"]').waitFor({state:'attached'});
  await waitSaved();
  assert.equal(saves.at(-1).override,'fondo','New background is saved and selected');
  await page.locator('.adm-sjimg[data-id="fondo"]').setInputFiles(upload('jackpot.png'));await waitSaved();
  await page.locator('.adm-spimg[data-id="fondo"]').setInputFiles(upload('especial.png'));await waitSaved();
  await page.locator('.adm-sfimg[data-id="fondo"]').setInputFiles(Array.from({length:5},(_,i)=>upload('simbolo-'+i+'.png')));await waitSaved();
  const theme=saves.at(-1).themes.find(item=>item.id==='fondo');
  assert.equal(theme.sym.imageFillers.length,5);
  assert.equal(theme.sym.mode,'images');
  assert.ok(JSON.stringify(saves.at(-1)).length<3800000,'Entire seven-symbol configuration fits the cloud budget');
  const properties=await page.evaluate(async src=>{
    const image=new Image();image.src=src;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    return {width:image.naturalWidth,alpha:ctx.getImageData(0,0,1,1).data[3]};
  },theme.sym.imageJackpot);
  assert.ok(properties.width<=512);assert.equal(properties.alpha,0,'Transparent PNG stays transparent after optimization');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.getByLabel('PIN de administrador',{exact:true}).fill('fixture-admin');await page.locator('#admPinOk').click();
  await page.getByRole('heading',{name:'Panel del club',exact:true}).waitFor();
  await visit('sec-fondos');
  await page.locator('.adm-theme[data-id="fondo"]').waitFor({state:'attached'});
  assert.equal(await page.locator('#admOverride').inputValue(),'fondo','Cloud restores selection after reload with no local cache');
  assert.equal(await page.locator('.adm-smode[data-id="fondo"]').inputValue(),'images');
  assert.equal(await page.locator('.adm-theme[data-id="fondo"] .adm-symbol-gallery img').count(),7,'All seven symbols survive reload');
  await page.locator('.adm-thumb[data-id="fondo"]').click();
  failSave=true;
  await page.locator('#admSave').click();
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.dataset.state==='error');
  assert.ok((await page.locator('#admSaveState').innerText()).includes('No se ha publicado'),'Failed save stays visible after rerender');
  failSave=false;
  await page.locator('#admOverride').selectOption('fondo');await waitSaved();
  await page.screenshot({path:'test-results/admin-theme-upload-saved.png'});

  await page.locator('#admClose').click();
  assert.equal(await page.locator('#adminScreen').isVisible(),false);
  await page.getByPlaceholder('Tu usuario',{exact:true}).fill('demo');
  await page.getByPlaceholder('Tu contraseña',{exact:true}).fill('demo');
  await page.getByRole('button',{name:'Entrar al club'}).click();
  await page.locator('#userNavBottom').getByRole('button',{name:'Jugar',exact:true}).click();
  await page.locator('#clubGame.has-custom-theme').waitFor({state:'visible'});
  await page.locator('.reels .symbol-img').first().waitFor({state:'visible'});
  assert.ok((await page.locator('#clubGame').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('data:image/webp'));
  assert.ok((await page.locator('.reels .symbol-img').first().getAttribute('src')).startsWith('data:image/webp'));
  assert.deepEqual(errors,[]);
  console.log('Admin PIN, navigation, statistics, photos, roulette, client modal and responsive layout passed');
}catch(error){
  if(page){await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/admin-failure.png',fullPage:true});console.log((await page.locator('body').innerText()).slice(-3500));}
  throw error;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
