import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8'});
let browser;
try {
  for(let i=0;i<90;i++){
    try {browser=await chromium.connectOverCDP('http://127.0.0.1:9222');break;}
    catch {await new Promise(r=>setTimeout(r,1000));}
  }
  assert.ok(browser,'Chrome remote debugging becomes available');
  let page;
  for(let i=0;i<60;i++){
    page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://sanailcso.github.io/bares2/'));
    if(page)break;
    await new Promise(r=>setTimeout(r,1000));
  }
  assert.ok(page,'APK opens the actual club in Chrome');
  await page.locator('#loginCard').waitFor({state:'visible',timeout:60000});
  const capabilities=await page.evaluate(()=>({push:'PushManager' in window,notification:'Notification' in window,worker:'serviceWorker' in navigator,background:getComputedStyle(document.body).backgroundColor}));
  assert.deepEqual(capabilities,{push:true,notification:true,worker:true,background:'rgb(246, 244, 238)'});
  await page.screenshot({path:'android-push-light-login.png'});
  const session=await page.context().newCDPSession(page);
  await session.send('Browser.grantPermissions',{origin:'https://sanailcso.github.io',permissions:['notifications']});
  assert.equal(await page.evaluate(()=>Notification.requestPermission()),'granted');
  const subscription={notRequested:true}; // Identity is tested separately from remote push registration.
  adb('shell','input','keyevent','KEYCODE_HOME');
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    await registration.showNotification('TikiTaka aviso de prueba',{body:'Prueba local de avisos Android',tag:'tikitaka-android-smoke'});
  });
  await new Promise(r=>setTimeout(r,1200));
  const notifications=adb('shell','dumpsys','notification','--noredact');
  adb('shell','cmd','statusbar','expand-notifications');
  await new Promise(r=>setTimeout(r,500));
  await fs.writeFile('android-notification-panel.png',execFileSync('adb',['exec-out','screencap','-p']));
  assert.ok(notifications.includes('TikiTaka aviso de prueba'),'Android displays the worker notification while the app is in background');
  {
    const record=notifications.split(/(?=NotificationRecord\\()/).find(part=>part.includes('TikiTaka aviso de prueba'));
    await fs.writeFile('android-notification-record.txt',record||'not found');
    console.log('Notification owner:',record?.match(/pkg=([a-zA-Z0-9_.]+)/)?.[1] || 'not found');
    await fs.writeFile('android-notification-owner.json',JSON.stringify({owner:record?.match(/pkg=([a-zA-Z0-9_.]+)/)?.[1]||null,expected:'es.tikitaka.club.avisos'},null,2));
    assert.ok(record && /pkg=es\\.tikitaka\\.club\\.avisos(?:[ ,}\\n]|$)/.test(record),'Android attributes the notification to Tiki Taka, not Chrome');
  }
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    for(const n of await registration.getNotifications({tag:'tikitaka-android-smoke'}))n.close();
    const sub=await registration.pushManager.getSubscription();if(sub)await sub.unsubscribe();
  });
  await fs.writeFile('android-push-check.json',JSON.stringify({capabilities,subscription,backgroundNotification:true,appIdentityRequired:process.env.TIKITAKA_REQUIRE_APP_NOTIFICATION==='1',customerLogin:false,remoteCustomerSend:false},null,2));
  console.log('Real Chrome PushManager subscription and background notification passed; no customers contacted.');
} finally {await browser?.close();}
