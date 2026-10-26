import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildWeb} from '../scripts/build-web.mjs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
test('El paquete iPhone contiene solo el cliente y no depende de un sitio remoto',async()=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'tikitaka-ios-'));
  try{
    await buildWeb(root,temp);
    const html=await readFile(path.join(temp,'index.html'),'utf8');
    assert.ok(html.indexOf('native-ios.js')<html.indexOf('./assets/app.js'));
    assert.ok(!html.includes('rel="manifest"'));
    const app=await readFile(path.join(temp,'assets/app.js'),'utf8');
    assert.ok(app.includes('if(window.__TK_NATIVE_IOS__) return;'));
    for(const file of ['supabase','.github','.env','sw.js','native','tests'])assert.ok(!(await readdir(temp)).includes(file));
    for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)(?:\?[^"]*)?"/g)){
      await readFile(path.join(temp,match[1]));
    }
    await writeFile(path.join(temp,'stale-file.txt'),'old');
    await buildWeb(root,temp);
    assert.ok(!(await readdir(temp)).includes('stale-file.txt'),'Una compilación limpia no conserva archivos viejos');
  }finally{await rm(temp,{recursive:true,force:true});}
});
