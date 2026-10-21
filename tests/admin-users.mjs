import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const text=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const start=text.indexOf('  function loadAdminUsers('),end=text.indexOf('  function openAdminPwdModal2(',start);
assert.ok(start>=0&&end>start);
async function sync(serverUsers,oldUsers){
  const saved={};const scope={SB_ON:true,_admPin:'fixture',SB_URL:'',sbHeaders:()=>({}),DRAFT:{users:oldUsers},BUILTIN_USERS:{demo:{}},fetch:async()=>({ok:true,json:async()=>serverUsers}),localStorage:{setItem:(k,v)=>{saved[k]=JSON.parse(v);}},configWithoutSecrets:x=>JSON.parse(JSON.stringify(x)),applyCfgUsers(){},renderAdmin(){},loadAdminPoints(){}};
  vm.createContext(scope);vm.runInContext(text.slice(start,end),scope);scope.loadAdminUsers();await new Promise(r=>setImmediate(r));return {users:JSON.parse(JSON.stringify(scope.DRAFT.users)),saved};
}
const empty=await sync([{username:'demo',nombre:'Demo',bar:'Demo'}],[{u:'ghost'},{u:'removed'}]);
assert.deepEqual(empty.users,[],'Server list replaces cached ghosts instead of appending');
assert.deepEqual(empty.saved.tikitaka_admin_cfg.users,[],'Removed users cannot return after reload');
const active=await sync([{username:'bar_nuevo',nombre:'Nuevo',bar:'Bar nuevo'},{username:'old',active:false}],[{u:'ghost'}]);
assert.equal(active.users.length,1);assert.equal(active.users[0].u,'bar_nuevo');
assert.deepEqual((await sync([], [{u:'ghost'}])).users,[],'An empty authoritative list also clears stale users');
const error=await sync(null,[{u:'preserved'}]);assert.equal(error.users[0].u,'preserved','A failed response does not erase clients');
console.log('Usuarios del admin: sincronización sin cuentas fantasma superada');
