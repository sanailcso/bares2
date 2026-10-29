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
  const expected='es.tikitaka.club.avisos';
  adb('shell','input','keyevent','KEYCODE_HOME');
  let record='',owner=null;
  for(let attempt=0;attempt<12;attempt++){
    await page.evaluate(async()=>{
      const registration=await navigator.serviceWorker.ready;
      await registration.showNotification('TikiTaka aviso de prueba',{body:'Prueba local de identidad Android',tag:'tikitaka-android-smoke'});
    });
    await new Promise(r=>setTimeout(r,1000));
    const notifications=adb('shell','dumpsys','notification','--noredact');
    record=notifications.split('NotificationRecord(').find(part=>part.includes('TikiTaka aviso de prueba'))||'';
    owner=record.includes('pkg=')?record.split('pkg=')[1].split(' ')[0]:null;
    if(owner===expected)break;
    await new Promise(r=>setTimeout(r,1000));
  }
  adb('shell','cmd','statusbar','expand-notifications');
  await new Promise(r=>setTimeout(r,500));
  await fs.writeFile('android-notification-panel.png',execFileSync('adb',['exec-out','screencap','-p']));
  await fs.writeFile('android-notification-record.txt',record||'not found');
  await fs.writeFile('android-notification-owner.json',JSON.stringify({owner,expected},null,2));
  console.log('Notification owner:',owner);
  assert.equal(owner,expected,'Android must attribute the notification to Tiki Taka rather than Chrome');
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    for(const n of await registration.getNotifications({tag:'tikitaka-android-smoke'}))n.close();
    const sub=await registration.pushManager.getSubscription();if(sub)await sub.unsubscribe();
  });
  await fs.writeFile('android-push-check.json',JSON.stringify({capabilities,owner,backgroundNotification:true,customerLogin:false,remoteCustomerSend:false},null,2));
  console.log('Android notification ownership and background display passed; no customers contacted.');
} finally {await browser?.close();}
