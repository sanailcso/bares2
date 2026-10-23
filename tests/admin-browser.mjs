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
  let failSave=false,rpcFailure=null;
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
    if(fn==='app_admin_save_config' && rpcFailure){
      await route.fulfill({status:rpcFailure.status,headers,contentType:rpcFailure.type||'application/json',body:rpcFailure.body});return;
    }
    if(fn==='app_admin_save_config' && Number(args.p_data?.rev)>2147483647){
      await route.fulfill({status:400,headers,contentType:'application/json',body:JSON.stringify({code:'22003',message:'integer out of range'})});return;
    }
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
  const homeSettings={fade:65,reach:75,angle:120,scale:125,x:-8,y:6,rotate:15};
  await page.locator('.adm-rw-home').first().click();
  const homeDialog=page.locator('.goal-appearance-dialog');
  for(const [key,value] of Object.entries(homeSettings)){
    await homeDialog.locator('[data-setting="'+key+'"]').evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  }
  assert.match(await homeDialog.locator('.club-goal-art').evaluate(e=>e.style.maskImage),/120deg/);
  assert.match(await homeDialog.locator('.club-goal-art>img').evaluate(e=>e.style.transform),/rotate\(15deg\)/);
  await page.screenshot({path:'test-results/admin-home-appearance.png'});
  await homeDialog.getByRole('button',{name:'Guardar ajustes',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
  assert.deepEqual(saves.at(-1).rewards[0].homeAppearance,homeSettings);
  assert.equal(saves.at(-1).rewards[1].homeAppearance,undefined,'Other prizes keep their defaults');
  await page.locator('.adm-rw-home').first().click();
  await homeDialog.getByRole('button',{name:'Restablecer',exact:true}).click();
  assert.equal(await homeDialog.locator('[data-setting="rotate"]').inputValue(),'0');
  await homeDialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  assert.deepEqual(saves.at(-1).rewards[0].homeAppearance,homeSettings,'Cancel does not save reset');
  // Portrait and landscape uploads keep every edge inside the saved 4:3 frame.
  for (const [w,h] of [[80,240],[300,80]]) {
    const data=await page.evaluate(([w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#f00';x.fillRect(0,0,w,h);return c.toDataURL('image/png').split(',')[1];},[w,h]);
    await page.locator('.adm-rw-img').first().setInputFiles({name:'product.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
    const dialog=page.locator('.reward-frame-dialog');
    await dialog.waitFor({state:'visible'});
    const bounds=await dialog.locator('canvas').evaluate(c=>{
      const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=512,r=0,t=384,b=0;
      for(let y=0;y<384;y++)for(let x=0;x<512;x++)if(d[(y*512+x)*4+3]>0){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
      return {l,r,t,b};
    });
    assert.ok(bounds.l>=15&&bounds.r<=496&&bounds.t>=15&&bounds.b<=368,'Whole image has breathing room');
    assert.ok(Math.abs(bounds.l-(511-bounds.r))<=1&&Math.abs(bounds.t-(383-bounds.b))<=1,'Upload is centered');
    await dialog.locator('canvas').press('ArrowRight');
    await dialog.getByRole('button',{name:'Centrar y ver completa'}).click();
    await page.screenshot({path:'test-results/reward-frame-'+w+'x'+h+'.png'});
    await dialog.getByRole('button',{name:'Usar este encuadre'}).click();
    await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
    assert.ok(saves.at(-1).rewards[0].image.startsWith('data:image/webp'));
  }
  await photo.selectOption('./img/club-cap.webp');
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
  await visit('sec-apuesta');
  // Upload both independent appearance assets and restore from the mocked server.
  const originalBet=structuredClone(publicConfig.bet);
  const rouletteAsset=await fs.readFile(path.join(root,'img/roulette-premium.webp'));
  for(const kind of ['Icon','Wheel']){
    const count=saves.length;
    await page.locator('#admRoulette'+kind).setInputFiles({name:kind+'.webp',mimeType:'image/webp',buffer:rouletteAsset});
    await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
    assert.ok(saves.length>count);
    assert.ok(saves.at(-1).bet.appearance[kind.toLowerCase()].startsWith('data:image/webp'));
  }
  await page.locator('#admRouletteFinish').selectOption('silver');
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
  const appearance=structuredClone(saves.at(-1).bet.appearance);
  assert.deepEqual(saves.at(-1).bet.segments,originalBet.segments);
  await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.getByLabel('PIN de administrador',{exact:true}).fill('fixture-admin');await page.locator('#admPinOk').click();
  await page.getByRole('heading',{name:'Panel del club',exact:true}).waitFor();
  await visit('sec-premios');
  await page.locator('.adm-rw-home').first().click();
  for(const [key,value] of Object.entries(homeSettings)) assert.equal(await homeDialog.locator('[data-setting="'+key+'"]').inputValue(),String(value),'Setting survives reload: '+key);
  await homeDialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  await visit('sec-apuesta');
  assert.equal(await page.locator('#admRouletteFinish').inputValue(),'silver');
  assert.equal(await page.locator('.adm-roulette-preview>.roulette-icon').getAttribute('src'),appearance.icon);
  assert.equal(await page.locator('.adm-roulette-preview .roulette-case').getAttribute('src'),appearance.wheel);
  await page.screenshot({path:'test-results/roulette-admin.png'});
  await page.locator('#admRouletteReset').click();
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.textContent.includes('Guardado'));
  assert.deepEqual(saves.at(-1).bet.appearance,{});
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
  const festive=page.locator('.adm-festive[data-id="fondo"]');
  await festive.locator('select').selectOption('halloween');await waitSaved();
  await festive.locator('input').evaluate(input=>{input.value='22';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});await waitSaved();
  assert.deepEqual(saves.at(-1).themes.find(t=>t.id==='fondo').decoration,{style:'halloween',intensity:22});
  assert.equal(await festive.locator('.festive-preview-layer').getAttribute('data-festive'),'halloween');
  assert.equal(await page.locator('#clubFestive').isVisible(),false,'Decorations stay out of the admin');
  await page.screenshot({path:'test-results/festive-admin.png'});

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
  assert.equal(await festive.locator('select').inputValue(),'halloween','Festive style survives cloud reload');
  assert.equal(await festive.locator('input').inputValue(),'22');

  assert.equal(await page.locator('.adm-theme[data-id="fondo"] .adm-symbol-gallery img').count(),7,'All seven symbols survive reload');
  await page.locator('.adm-thumb[data-id="fondo"]').click();
  failSave=true;
  await page.locator('#admSave').click();
  await page.waitForFunction(()=>document.querySelector('#admSaveState')?.dataset.state==='error');
  assert.ok((await page.locator('#admSaveState').innerText()).includes('No se ha publicado'),'Failed save stays visible after rerender');
  failSave=false;
  await page.locator('#admOverride').selectOption('fondo');await waitSaved();

  // Exercise the real Publish button against different HTTP failures.
  const publishingErrors=[
    {status:403,body:JSON.stringify({code:'42501',message:'permission denied for schema private'}),expected:'permiso'},
    {status:404,body:JSON.stringify({code:'PGRST202',message:'Could not find the function'}),expected:'falta la función'},
    {status:413,type:'text/html',body:'<html>Payload Too Large</html>',expected:'imágenes superan'},
    {status:504,type:'text/plain',body:'Gateway timeout',expected:'agotó el tiempo'}
  ];
  for(const error of publishingErrors){
    rpcFailure=error;
    await page.locator('#admForceUpdate').click();
    await page.waitForFunction(text=>document.querySelector('#admForceNote')?.textContent.includes(text),error.expected);
    assert.ok((await page.locator('#admForceNote').innerText()).includes('HTTP '+error.status));
  }
  rpcFailure=null;
  await page.locator('#admForceUpdate').click();
  await page.waitForFunction(()=>document.querySelector('#admForceNote')?.textContent.startsWith('Publicado.'));
  assert.ok(Number(saves.at(-1).rev)<=2147483647,'Publish does not invent a timestamp revision that breaks integer backends');

  await page.screenshot({path:'test-results/admin-theme-upload-saved.png'});

  await page.locator('#admClose').click();
  assert.equal(await page.locator('#adminScreen').isVisible(),false);
  await page.getByPlaceholder('Tu usuario',{exact:true}).fill('demo');
  await page.getByPlaceholder('Tu contraseña',{exact:true}).fill('demo');
  await page.getByRole('button',{name:'Entrar al club'}).click();
  await page.waitForFunction(()=>document.querySelector('#clubGoalSelect')?.options.length>0);
  assert.equal(await page.locator('#clubFestive').isVisible(),true);
  assert.equal(await page.locator('#clubFestive').evaluate(e=>getComputedStyle(e).pointerEvents),'none','Decoration cannot block taps');
  assert.equal(await page.locator('#clubFestive').evaluate(e=>getComputedStyle(e).opacity),'0.22');
  await page.locator('#clubFestive img').first().evaluate(image=>image.decode());
  assert.equal(await page.locator('#clubFestive svg').count(),0,'Halloween uses the photographic asset');
  assert.equal(await page.locator('#clubFestive img').first().getAttribute('src'),'./img/halloween-silk-web.webp');
  assert.equal(await page.locator('#clubFestive img').first().evaluate(image=>image.naturalWidth),768);

  const calendar=await page.evaluate(()=>{
    const previous=PREVIEW_CFG,cfg=clone(ACTIVE_CFG),date=new Date();
    cfg.override=null;cfg.fallback='default';cfg.themes.find(t=>t.id==='default').decoration={style:'none',intensity:18};
    cfg.schedule=[{themeId:'fondo',from:{m:date.getMonth()+1,d:date.getDate()},to:{m:date.getMonth()+1,d:date.getDate()}}];
    PREVIEW_CFG=cfg;syncFestiveDecoration();const scheduled=document.getElementById('clubFestive').dataset.festive;
    cfg.schedule=[];syncFestiveDecoration();const hidden=document.getElementById('clubFestive').hidden;
    cfg.override='fondo';syncFestiveDecoration();const manual=document.getElementById('clubFestive').dataset.festive;
    PREVIEW_CFG=previous;syncFestiveDecoration();return {scheduled,hidden,manual};
  });
  assert.deepEqual(calendar,{scheduled:'halloween',hidden:true,manual:'halloween'},'Calendar enables decoration; fallback removes it; manual selection overrides');
  await page.screenshot({path:'test-results/festive-player.png'});

  await page.locator('#userNavBottom').getByRole('button',{name:'Premios',exact:true}).click();
  await page.locator('#clubGoalSelect').selectOption(publicConfig.rewards[0].name);
  await page.locator('#userNavBottom').getByRole('button',{name:'Inicio',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#clubGoalArt')?.style.maskImage.includes('120deg'));
  assert.match(await page.locator('#clubGoalArt').evaluate(e=>e.style.maskImage),/120deg/);
  assert.match(await page.locator('#clubGoalArt>img').evaluate(e=>e.style.transform),/rotate\(15deg\)/);
  await page.screenshot({path:'test-results/player-home-appearance.png'});
  await page.locator('#userNavBottom').getByRole('button',{name:'Jugar',exact:true}).click();
  await page.locator('#clubGame.has-custom-theme').waitFor({state:'visible'});
  await page.locator('.reels .symbol-img').first().waitFor({state:'visible'});
  assert.ok((await page.locator('#clubGame').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('data:image/webp'));
  assert.ok((await page.locator('.reels .symbol-img').first().getAttribute('src')).startsWith('data:image/webp'));
  // Exercise the real player entry with available spins, normal and golden.
  for(const width of [320,390]){
    await page.setViewportSize({width,height:700});
    for(const golden of [false,true]){
      await page.evaluate(golden=>{state.goldenRound=golden;state.betSpins=3;_serverSpins=3;setGame('slot');renderRuletaCta();},golden);
      await page.locator('#rcGo').waitFor({state:'visible'});
      assert.ok(await page.locator('#ruletaCta .roulette-icon').isVisible(),'Configured entry icon is visible');
      await page.locator('#rcGo').click();
      const wheel=page.locator('#betWheel');await wheel.waitFor({state:'visible'});
      assert.equal(await page.locator('#betPanel .roulette-case').getAttribute('src'),'./img/roulette-premium.webp');
      assert.equal(await page.locator('#betPanel .bet-marquee .roulette-icon').getAttribute('src'),'./img/roulette-premium.webp');
      const box=await wheel.boundingBox();assert.ok(box.x>=0 && box.x+box.width<=width);
      assert.equal(await wheel.locator('.bet-seg-label').count(),await page.evaluate(()=>wheelLayout(activeBetCfg().segments).length));
      assert.ok((await wheel.evaluate(e=>getComputedStyle(e).backgroundImage)).includes('conic-gradient'));
      await page.screenshot({path:'test-results/roulette-'+width+'-'+golden+'.png'});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('Admin PIN, navigation, statistics, photos, roulette, client modal and responsive layout passed');
}catch(error){
  if(page){await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/admin-failure.png',fullPage:true});console.log((await page.locator('body').innerText()).slice(-3500));}
  throw error;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}




