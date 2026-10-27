import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/sw.js'){res.writeHead(404);res.end();return;}
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
 const data=await fs.readFile(file);res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch(process.env.SURVEY_CHROMIUM_PATH?{executablePath:process.env.SURVEY_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--single-process']}:{});
const surveys=[],answers=new Map(),saves=[],errors=[];
const users=[{username:'ana',nombre:'Ana',bar:'Bar Uno'},{username:'bea',nombre:'Bea',bar:'Bar Dos'}];
let failAnswer=false,failSave=false;
const tokenFor=u=>u==='ana'?'00000000-0000-4000-8000-000000000001':'00000000-0000-4000-8000-000000000002';
async function setup(viewport={width:390,height:844}){
 const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('tikitaka_ios_hint','1'));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url());if(url.hostname==='127.0.0.1'){await route.continue();return;}
 if(!url.hostname.endsWith('.supabase.co')){await route.abort();return;}
 const headers={'access-control-allow-origin':'*','access-control-allow-headers':'apikey,authorization,content-type','access-control-allow-methods':'POST,GET,OPTIONS'};
 if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
 const fn=url.pathname.split('/').pop(),args=req.postDataJSON()||{};let data={ok:true};
 if(fn==='app_admin_check')data=args.p_pin==='fixture-admin';
 else if(fn==='app_public_config')data={rev:1};
 else if(fn==='app_admin_users')data=users;
 else if(fn==='app_admin_players'||fn==='app_admin_redemptions'||fn==='app_admin_events')data=[];
 else if(fn==='app_admin_surveys')data={ok:true,surveys};
 else if(fn==='app_admin_save_survey'){
  if(failSave)data={ok:false,error:'server'};
  else{const old=surveys.find(s=>s.id===args.p_survey.id);const survey={...args.p_survey,version:(old?.version||0)+1,response_count:old?.response_count||0};if(old)surveys.splice(surveys.indexOf(old),1);surveys.unshift(survey);saves.push(structuredClone(args));data={ok:true,survey};}
 }
 else if(fn==='app_login')data={ok:true,token:tokenFor(args.p_username),nombre:args.p_username,bar:users.find(u=>u.username===args.p_username)?.bar,state:{points:500,lastSpin:null,streak:0,betSpins:0,history:[]}};
 else if(fn==='app_state')data={ok:true,points:500,lastSpin:null,streak:0,betSpins:0};
 else if(fn==='app_pending_surveys'){
  const u=users.find(u=>tokenFor(u.username)===args.p_token);
  data={ok:true,surveys:surveys.filter(s=>s.status==='active'&&(!s.starts_at||Date.parse(s.starts_at)<=Date.now())&&(!s.ends_at||Date.parse(s.ends_at)>Date.now())&&!answers.has(s.id+u.username)&&(s.audience==='all'||s.targets.includes(s.audience==='bars'?u.bar:u.username))).map(s=>({id:s.id,question:s.question,kind:s.kind,options:s.options,image:s.image,ends_at:s.ends_at}))};
 }
 else if(fn==='app_answer_survey'){
  if(failAnswer)data={ok:false,error:'server'};
  else{const u=users.find(u=>tokenFor(u.username)===args.p_token);const key=args.p_id+u.username;data={ok:true,duplicate:answers.has(key)};if(!answers.has(key)){answers.set(key,{username:u.username,nombre:u.nombre,bar:u.bar,answer:args.p_answer,created_at:new Date().toISOString()});surveys.find(s=>s.id===args.p_id).response_count++;}}
 }
 else if(fn==='app_admin_survey_results'){
  const s=surveys.find(s=>s.id===args.p_id),rows=[...answers.entries()].filter(([k])=>k.startsWith(s.id)).map(([,v])=>v);
  data={ok:true,total:rows.length,counts:s.options.map(o=>({label:o.label,count:rows.filter(r=>r.answer.includes(o.id)).length})),responses:rows,next_offset:null};
 }
 await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(data)});
 });
 return {context,page};
}
async function login(page,user){await page.goto(base);await page.locator('#userInput').fill(user);await page.locator('#passInput').fill('fixture-password');await page.locator('#loginBtn').click();await page.locator('#appCard').waitFor({state:'visible'});}
async function adminLogin(page){await page.goto(base+'/#admin');await page.getByLabel('PIN de administrador',{exact:true}).fill('fixture-admin');await page.locator('#admPinOk').click();await page.getByRole('heading',{name:'Panel del club',exact:true}).waitFor();await page.locator('.survey-admin-notice').filter({hasText:'Encuestas actualizadas'}).waitFor();}
const base='http://127.0.0.1:'+server.address().port;
let page;
try{
 ({page}=await setup());await adminLogin(page);
 assert.equal(await page.locator('.adm-menu-i[data-t="sec-encuestas"]').count(),1);
 await page.locator('.survey-new').click();
 await page.locator('[data-field="question"]').fill('¿Qué regalo te gustaría?');
 await page.locator('[data-option="0"]').fill('Gorra premium');await page.locator('[data-option="1"]').fill('Gafas de sol');
 await page.locator('[data-field="audience"]').selectOption('clients');
 await page.locator('.survey-search').fill('ana');assert.equal(await page.locator('.survey-target:visible').count(),1);
 await page.locator('.survey-target input[value="ana"]').check();
 await page.locator('[data-image-index="-1"] input').setInputFiles({name:'gift.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=','base64')});
 await page.locator('.survey-admin-notice').filter({hasText:'Imagen preparada'}).waitFor();
 await page.locator('.survey-preview summary').click();assert.equal(await page.locator('.survey-preview-content h2').textContent(),'¿Qué regalo te gustaría?');
 assert.equal(await page.locator('.survey-preview-content .survey-option').count(),2);
 await page.locator('[data-field="status"]').selectOption('active');
 failSave=true;await page.locator('.survey-save').click();await page.locator('.survey-admin-notice').filter({hasText:'No se ha podido guardar'}).waitFor();
 assert.equal(await page.locator('[data-field="question"]').inputValue(),'¿Qué regalo te gustaría?');
 assert.equal(await page.locator('.survey-save').isEnabled(),true);
 failSave=false;await page.locator('.survey-save').click();await page.locator('.survey-admin-notice').filter({hasText:'guardada y activada'}).waitFor();
 assert.deepEqual(saves.at(-1).p_survey.targets,['ana']);assert.match(saves.at(-1).p_survey.image,/^data:image\/webp/);
 await fs.mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
 await page.locator('#sec-encuestas').screenshot({path:path.join(root,'test-results/surveys-admin-mobile.png')});
 await page.locator('.survey-cancel').click();
 await page.setViewportSize({width:1280,height:900});
 assert.equal(await page.locator('#adminScreen').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
 const other=await setup();await login(other.page,'bea');
 assert.equal(await other.page.locator('#clubSurveys').isHidden(),true,'Unselected client has no card');
 assert.equal(await other.page.locator('#clubSurveys').evaluate(e=>e.getBoundingClientRect().height),0,'Empty section takes no space');
 const client=await setup();await login(client.page,'ana');
 await client.page.locator('#clubSurveys h2').waitFor();
 await client.page.locator('#clubSurveys').screenshot({path:path.join(root,'test-results/surveys-client-mobile.png')});
 assert.equal(await client.page.locator('#clubSurveys').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
 await client.page.locator('#clubSurveys input[value="option-1"]').check();
 await client.page.evaluate(()=>TkSurveys.refreshPlayer());
 assert.equal(await client.page.locator('#clubSurveys input[value="option-1"]').isChecked(),true,'Polling preserves chosen answer');
 failAnswer=true;await client.page.locator('#clubSurveys button[type=submit]').click();
 await client.page.locator('.survey-feedback').filter({hasText:'No se ha podido guardar'}).waitFor();
 assert.equal(await client.page.locator('#clubSurveys input[value="option-1"]').isChecked(),true,'Failure preserves answer');
 failAnswer=false;await client.page.locator('#clubSurveys button[type=submit]').click();
 await client.page.locator('#clubSurveys').waitFor({state:'hidden'});assert.equal(answers.size,1);
 // Explicitly reconnect a second device with the same account: answer stays absent.
 const second=await setup();await login(second.page,'ana');assert.equal(await second.page.locator('#clubSurveys').isHidden(),true);
 await page.locator('[data-results]').click();await page.locator('.survey-results .survey-response').waitFor();
 assert.match(await page.locator('.survey-results').textContent(),/1 participantes/);assert.match(await page.locator('.survey-results').textContent(),/Gorra premium/);
 await page.locator('.survey-new').click();await page.locator('[data-field="question"]').fill('¿Te gusta la app?');
 await page.locator('[data-field="kind"]').selectOption('rating');
 await page.locator('[data-field="audience"]').selectOption('bars');await page.locator('.survey-target input[value="Bar Dos"]').check();
 await page.locator('[data-field="status"]').selectOption('active');await page.locator('.survey-save').click();await page.locator('.survey-admin-notice').filter({hasText:'guardada y activada'}).waitFor();
 await other.page.evaluate(()=>TkSurveys.refreshPlayer());await other.page.locator('.survey-rating').waitFor();
 await other.page.locator('.survey-rating input[value="4"]').check();await other.page.locator('#clubSurveys button[type=submit]').click();await other.page.locator('#clubSurveys').waitFor({state:'hidden'});
 await page.locator('.survey-cancel').click();await page.locator('.survey-new').click();
 await page.locator('[data-field="question"]').fill('Cuéntanos una idea');await page.locator('[data-field="kind"]').selectOption('text');
 await page.locator('[data-field="status"]').selectOption('active');await page.locator('.survey-save').click();await page.locator('.survey-admin-notice').filter({hasText:'guardada y activada'}).waitFor();
 await other.page.evaluate(()=>TkSurveys.refreshPlayer());await other.page.locator('#clubSurveys textarea').waitFor();
 await other.page.locator('.survey-dismiss').click();assert.equal(await other.page.locator('#clubSurveys').isHidden(),true);
 // Dismissal is only for this session; it does not create a response.
 assert.equal(answers.size,2);
 await page.locator('.survey-cancel').click();
 assert.deepEqual(errors,[]);console.log('Survey admin, audience controls, uploads, preview, results, retry, mobile and empty state passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
