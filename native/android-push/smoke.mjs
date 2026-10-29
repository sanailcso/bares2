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
  // Only this emulator subscribes; no user login, no customer registration or server sends.
  const subscription=await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    const sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlB64ToUint8(VAPID_PUBLIC)});
    return {endpointHost:new URL(sub.endpoint).hostname,hasKeys:!!sub.toJSON().keys?.p256dh};
  });
  assert.equal(subscription.hasKeys,true,'Browser obtains a real Web Push subscription');
  adb('shell','input','keyevent','KEYCODE_HOME');
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    await registration.showNotification('TikiTaka aviso de prueba',{body:'Prueba local de avisos Android',tag:'tikitaka-android-smoke'});
  });
  await new Promise(r=>setTimeout(r,1200));
  const notifications=adb('shell','dumpsys','notification','--noredact');
  assert.ok(notifications.includes('TikiTaka aviso de prueba'),'Android displays the worker notification while the app is in background');
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    for(const n of await registration.getNotifications({tag:'tikitaka-android-smoke'}))n.close();
    const sub=await registration.pushManager.getSubscription();if(sub)await sub.unsubscribe();
  });
  await fs.writeFile('android-push-check.json',JSON.stringify({capabilities,subscription,backgroundNotification:true,customerLogin:false,remoteCustomerSend:false},null,2));
  console.log('Real Chrome PushManager subscription and background notification passed; no customers contacted.');
} finally {await browser?.close();}
