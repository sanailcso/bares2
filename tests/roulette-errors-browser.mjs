import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/sw.js'){res.writeHead(404);res.end();return;}const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}const body=await fs.readFile(file);res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
const errors=[];let page;
try{
 page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 let mode='http',failState=false,credits=1,betRequests=0;
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.hostname==='127.0.0.1'){await route.continue();return;}if(!url.hostname.endsWith('.supabase.co')){await route.abort();return;}
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'apikey,authorization,content-type','access-control-allow-methods':'POST,GET,OPTIONS'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
  const fn=url.pathname.split('/').pop();let status=200,data={ok:true};
  if(fn==='app_public_config')data={rev:1,themes:[{id:'default',name:'Clásico'}],fallback:'default',rewards:[],bet:{enabled:true,min:100,max:1000,segments:[{mult:1,w:1},{mult:2,w:1}]}};
  else if(fn==='app_login')data={ok:true,token:'00000000-0000-4000-8000-000000000001',nombre:'Fixture',bar:'Fixture',state:{points:1000,lastSpin:null,streak:0,betSpins:credits,history:[]}};
  else if(fn==='app_state'){data={ok:true,points:1000,betSpins:credits,streak:0,lastSpin:null};if(failState){status=503;data={code:'57014',message:'fixture state unavailable'};}}
  else if(fn==='app_pending_surveys')data={ok:true,surveys:[]};
  else if(fn==='app_bet'){
   ++betRequests;
   if(mode==='http'){status=500;data={code:'57014',message:'fixture SQL detail must not be shown'};}
   else if(mode==='odds')data={ok:false,error:'odds'};
   else if(mode==='limit'){credits=0;data={ok:false,error:'limit',points:1000,betSpins:0};}
   else if(mode==='legacy-limit')data={ok:false,error:'limit'};
  }
  await route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('#userInput').fill('test2');await page.locator('#passInput').fill('fixture');await page.locator('#loginBtn').click();await page.locator('#appCard').waitFor({state:'visible'});
 await page.waitForFunction(()=>_configReady);
 await page.evaluate(()=>{window.__tkNav.go('jugar');setGame('bet');});await page.locator('#betGo').waitFor();
 failState=true;await page.locator('#betGo').click();
 await page.locator('#betResult').filter({hasText:'HTTP 500 · 57014'}).waitFor();
 assert.equal(await page.locator('#betGo').isDisabled(),true,'An uncertain request cannot be played again until state is confirmed');
 assert.equal(await page.locator('#betRetrySync').isVisible(),true);
 assert.doesNotMatch(await page.locator('#betResult').textContent(),/SQL detail|Sin conexión/);
 assert.equal(betRequests,1,'No automatic replay');
 assert.equal(await page.evaluate(()=>state.points),1000);assert.equal(await page.evaluate(()=>state.history.length),0);
 failState=false;await page.locator('#betRetrySync').click();await page.waitForFunction(()=>!document.getElementById('betGo').disabled);
 assert.equal(await page.locator('#betLeft').textContent(),'1');
 mode='odds';await page.locator('#betGo').click();await page.locator('#betResult').filter({hasText:'configuración'}).waitFor();
 assert.equal(await page.evaluate(()=>state.betSpins),1);
 mode='legacy-limit';await page.locator('#betGo').click();await page.locator('#betResult').filter({hasText:'no ha permitido'}).waitFor();
 assert.equal(await page.locator('#betLeft').textContent(),'1');
 mode='limit';await page.locator('#betGo').click();await page.locator('#betResult').filter({hasText:'No tienes tiradas'}).waitFor({state:'attached'});
 assert.equal(await page.locator('#betLeft').textContent(),'0');assert.equal(await page.locator('#betGo').isDisabled(),true);
 assert.equal(await page.evaluate(()=>state.history.length),0);assert.deepEqual(errors,[]);
 console.log('Roulette HTTP errors, uncertain request reconciliation, configuration errors and confirmed credits passed');
}catch(error){if(page)console.error(JSON.stringify({errors,ui:await page.evaluate(()=>({ready:typeof _configReady!=='undefined'&&_configReady,game:typeof _game==='undefined'?null:_game,credits:typeof state==='undefined'?null:state&&state.betSpins,message:document.getElementById('betResult')?.textContent}))}));throw error;}finally{await browser.close();await new Promise(r=>server.close(r));}
