import {execFileSync} from 'node:child_process';
import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const run=(command,args)=>execFileSync(command,args,{encoding:'utf8'}).trim();
const archive=path.resolve('build-device/TikiTaka.xcarchive');
function plist(file){
  // Archive plists contain dates; plutil cannot convert those directly to JSON.
  return JSON.parse(run('python3',['-c','import json,plistlib,sys; print(json.dumps(plistlib.load(open(sys.argv[1],"rb")),default=str))',file]));
}
const details=plist(path.join(archive,'Info.plist'));
const appPath=details.ApplicationProperties?.ApplicationPath;
if(appPath!=='Applications/App.app')throw new Error('El archivo no contiene una única app de iPhone');
const app=path.join(archive,'Products',appPath);
const info=plist(path.join(app,'Info.plist'));
const config=JSON.parse(await readFile('capacitor.config.json','utf8'));
if(info.CFBundleIdentifier!==config.appId)throw new Error('El identificador no coincide con el proyecto');
if(!info.CFBundleSupportedPlatforms?.includes('iPhoneOS'))throw new Error('Se rechaza una compilación de simulador');
if(!/^[A-Za-z0-9_-]+$/.test(info.CFBundleExecutable||''))throw new Error('Nombre de ejecutable inesperado');
const binary=path.join(app,info.CFBundleExecutable);
const architectures=run('xcrun',['lipo','-archs',binary]).split(/\s+/);
if(!architectures.includes('arm64')||architectures.some(a=>a.startsWith('x86')))throw new Error('El ejecutable no es para iPhone real');
const buildInfo=run('xcrun',['vtool','-show-build',binary]);
if(!/platform\s+IOS\b/.test(buildInfo)||/IOSSIMULATOR/.test(buildInfo))throw new Error('La plataforma binaria no es iOS de dispositivo');
const output=path.resolve('device-delivery');
const folder=path.join(output,'TikiTaka-iPhone-para-firmar');
await rm(output,{recursive:true,force:true});
await mkdir(folder,{recursive:true});
await cp(archive,path.join(folder,'TikiTaka.xcarchive'),{recursive:true,verbatimSymlinks:true});
const metadata={
  application:'Tiki Taka',bundleId:info.CFBundleIdentifier,version:info.CFBundleShortVersionString,
  build:info.CFBundleVersion,platform:'iPhoneOS',architectures,signing:'unsigned',
  sourceCommit:process.env.GITHUB_SHA||null,workflowRun:process.env.GITHUB_RUN_ID||null,
  binarySha256:createHash('sha256').update(await readFile(binary)).digest('hex')
};
await writeFile(path.join(folder,'BUILD-INFO.json'),JSON.stringify(metadata,null,2)+'\n');
const instructions=`TIKI TAKA · ENTREGA PARA FIRMA EMPRESARIAL

Este paquete contiene una app compilada en Release para iPhone real (arm64), no para simulador.
Identificador: ${metadata.bundleId}
Versión: ${metadata.version} · Compilación: ${metadata.build}
Código fuente: ${metadata.sourceCommit}
No contiene certificados, claves privadas ni firma de distribución.
No es todavía una aplicación instalable ni una versión aprobada por Apple.

PARA EL DIRECTOR DE IT
1. Descomprimir este ZIP en un Mac con Xcode 26.2 o posterior.
2. Abrir TikiTaka.xcarchive con Xcode. Debe aparecer en Window > Organizer > Archives.
3. Confirmar que la cuenta empresarial puede distribuir el identificador ${metadata.bundleId}.
4. En Distribute App elegir TestFlight & App Store / App Store Connect.
5. Firmar con el certificado Apple Distribution y el perfil de distribución de la empresa
   correspondientes a ese identificador y equipo. Si Xcode no ofrece gestión automática,
   seleccionar la firma manual e importar el perfil de App Store Connect.
6. Validar y exportar una IPA firmada o subirla a App Store Connect.
7. Cuando Apple termine de procesarla, habilitar una prueba en TestFlight y enviar la invitación
   al usuario autorizado. Esta entrega no publica la app ni invita a nadie automáticamente.

No hay que instalar Node, Capacitor ni reconstruir la interfaz para firmar esta compilación.
Si IT necesita otro identificador, debe solicitar una nueva compilación con ese identificador.
Si la exportación requiere ajustes, el fuente reproducible está en:
https://github.com/sanailcso/bares2/tree/main/native/iphone

Las pruebas en dispositivo, las declaraciones de privacidad y la revisión de las mecánicas
de puntos/ruleta/premios deben completarse antes de la distribución final.
No compartir contraseñas ni certificados por chat, correo sin protección o comentarios públicos.
`;
await writeFile(path.join(folder,'LEEME-IT.txt'),instructions);
run('ditto',['-c','-k','--sequesterRsrc','--keepParent',folder,path.join(output,'TikiTaka-iPhone-para-firmar.zip')]);
console.log('Entrega verificada: '+metadata.bundleId+' · iPhoneOS · '+architectures.join(', '));
