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
  page.on('pageerror',e=>errors.push(e.message));
  const users=[{username:'fixture_bar',nombre:'Cliente de prueba',bar:'Bar de prueba',active:true}];
  const pending={id:'fixture-redemption',username:'fixture_bar',bar:'Bar de prueba',premio:'Llavero premium',puntos:2500,delivered:false,cancelled:false,created_at:'2026-10-22T09:00:00Z'};
  const publicConfig={rev:1,bet:{enabled:true,min:100,max:1000,perDay:3,segments:[{mult:1,w:90},{mult:2,w:10}]}};
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
    else if(fn==='app_admin_save_config'){saves.push(args.p_data);data={ok:true,rev:1};}
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
  await page.locator('#admClose').click();
  assert.equal(await page.locator('#adminScreen').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('Admin PIN, navigation, statistics, photos, roulette, client modal and responsive layout passed');
}catch(error){
  if(page){await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/admin-failure.png',fullPage:true});console.log((await page.locator('body').innerText()).slice(-3500));}
  throw error;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
