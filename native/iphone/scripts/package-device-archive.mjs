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
  sourceCommit:run('git',['rev-parse','HEAD']),workflowRun:process.env.GITHUB_RUN_ID||null,
  binarySha256:createHash('sha256').update(await readFile(binary)).digest('hex'),
  nativePush:'not_configured',companyDomain:'tikitaka.es',bundledClientSha256:{}
};
for(const relative of ['index.html','assets/app.js','assets/club.css','assets/club.js','assets/native-ios.js','assets/native-ios.css']){
  const packaged=await readFile(path.join(app,'public',relative));
  const expected=await readFile(path.join('www',relative));
  if(!packaged.equals(expected))throw new Error('El archivo incluye una interfaz distinta: '+relative);
  metadata.bundledClientSha256[relative]=createHash('sha256').update(packaged).digest('hex');
}
const swiftPackage=await readFile('ios/App/CapApp-SPM/Package.swift','utf8');
if(swiftPackage.includes('node_modules'))throw new Error('El proyecto entregado depende de herramientas no incluidas');
await cp('ios',path.join(folder,'Proyecto-Xcode','ios'),{recursive:true,verbatimSymlinks:true,filter:source=>!source.split(path.sep).some(part=>['xcuserdata','.build','build','.DS_Store'].includes(part))});
await writeFile(path.join(folder,'BUILD-INFO.json'),JSON.stringify(metadata,null,2)+'\n');
const instructions=`TIKI TAKA · IPHONE · ENTREGA PARA IT

Incluye la aplicación Release compilada para iPhone real (arm64), el proyecto Xcode con la interfaz incluida y los datos de la compilación.
Identificador: ${metadata.bundleId}
Versión: ${metadata.version} · Compilación: ${metadata.build}
Código fuente: ${metadata.sourceCommit}
Dominio de la empresa: tikitaka.es

ESTADO DE LA ENTREGA
El archivo no tiene firma de distribución. No es una IPA instalable directamente ni una versión enviada a Apple.
La interfaz, cuentas, puntos, catálogo, ruleta, encuestas y temas corresponden al código indicado. El diseño se mantiene claro con el sistema oscuro.
Los avisos nativos de iPhone/APNs NO están integrados ni configurados en esta entrega. El botón de avisos web permanece oculto en la app nativa. Los avisos de la APK Android no se trasladan automáticamente a iOS.

FIRMAR Y DISTRIBUIR CON LA CUENTA EMPRESARIAL
1. Descomprimir en un Mac con Xcode 26.2 o posterior.
2. Abrir TikiTaka.xcarchive en Xcode → Window → Organizer → Archives.
3. Confirmar el identificador ${metadata.bundleId} en el equipo Apple Developer de la empresa.
4. En Distribute App, seleccionar TestFlight & App Store y gestionar la firma con el equipo empresarial, su certificado y su perfil de distribución.
5. Validar y exportar una IPA firmada o subir la compilación a App Store Connect; después se puede distribuir por TestFlight a los usuarios autorizados.

SI XCODE NECESITA RECOMPILAR PARA LA FIRMA
Abrir Proyecto-Xcode/ios/App/App.xcodeproj. La interfaz ya está dentro del proyecto y Capacitor está fijado a la versión del código. No hace falta instalar Node ni regenerar la web: Xcode descarga sus dependencias Swift.
Seleccionar el equipo empresarial en Signing & Capabilities y archivar para un iPhone real con Product → Archive.
Si el identificador corporativo debe ser distinto, solicitar una compilación con ese identificador.

El paquete no contiene contraseñas, certificados de la empresa ni claves privadas. No configura cuentas Apple, publica la app ni envía invitaciones.
Las pruebas automáticas cubren empaquetado, compilación y arranque en simulador con apariencia clara y oscura; no sustituyen la comprobación de sesión, conexión, juegos y catálogo en un iPhone físico.
`;
await writeFile(path.join(folder,'LEEME-IT.txt'),instructions);
run('ditto',['-c','-k','--sequesterRsrc','--keepParent',folder,path.join(output,'TikiTaka-iPhone-para-firmar.zip')]);
console.log('Entrega verificada: '+metadata.bundleId+' · iPhoneOS · '+architectures.join(', '));
