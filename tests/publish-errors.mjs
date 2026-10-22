import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
function part(first,last){const a=source.indexOf(first),b=source.indexOf(last,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
const scope={SB_ON:true,SB_URL:'https://fixture.invalid',sbHeaders:()=>({}),_admPin:'fixture-secret'};
vm.createContext(scope);vm.runInContext(part('  function sbRpc(','  function secureAuthLogin(')+part('  function configSaveError(','  function refreshPublicConfig('),scope);
async function failure(status,body){
  scope.fetch=async()=>({ok:status>=200&&status<300,status,text:async()=>body});
  try{await scope.sbRpc('app_admin_save_config',{});assert.fail('Expected rejection');}catch(error){return error;}
}
const denied=await failure(403,JSON.stringify({code:'42501',message:'permission denied for schema private'}));
assert.equal(denied.status,403);assert.equal(denied.code,'42501');assert.match(scope.configSaveError(denied),/permiso.*HTTP 403.*42501/);
assert.doesNotMatch(scope.configSaveError(denied),/Revisa la conexión/);
const missing=await failure(404,JSON.stringify({code:'PGRST202',message:'Could not find the function'}));assert.match(scope.configSaveError(missing),/falta la función/);
const overflow=await failure(400,JSON.stringify({code:'22003',message:'integer out of range'}));assert.match(scope.configSaveError(overflow),/número de versión/);
assert.match(scope.configSaveError(await failure(413,'<html>Payload Too Large</html>')),/imágenes superan/);
assert.match(scope.configSaveError(await failure(504,'Gateway timeout')),/agotó el tiempo/);
const unknown=await failure(400,JSON.stringify({code:'XX001',message:'fixture-original-error'}));assert.match(scope.configSaveError(unknown),/XX001.*fixture-original-error/);
assert.match(scope.configSaveError(await failure(200,'unexpected non-json')),/HTTP 200.*invalid_response.*no JSON/);
scope.fetch=async()=>{throw new TypeError('Failed to fetch');};
try{await scope.sbRpc('app_admin_save_config',{});}catch(error){assert.match(scope.configSaveError(error),/no se pudo conectar/);}
assert.doesNotMatch(scope.configSaveError(new TypeError('Cannot read property fixture')),/no se pudo conectar/);
assert.doesNotMatch(scope.configSaveError(new Error('fixture-secret data:image/png;base64,PRIVATE')),/fixture-secret|PRIVATE/,'Never print PIN or uploaded image data in errors');
console.log('Publishing diagnostics: HTTP, server codes, invalid JSON, network failures and redaction passed');
