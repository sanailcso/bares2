import {access,copyFile,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {buildWeb} from './build-web.mjs';
const project=fileURLToPath(new URL('../',import.meta.url));
process.chdir(project);
function run(command,args){const p=spawnSync(command,args,{stdio:'inherit'});if(p.status!==0)throw new Error(command+' no terminó correctamente');}
await buildWeb();
try{await access('ios/App/App.xcodeproj');}catch{run('npx',['--no-install','cap','add','ios']);}
const delegate='ios/App/App/AppDelegate.swift';
let swift=await readFile(delegate,'utf8');
const marker='// Compiled alongside AppDelegate';
if(swift.includes(marker))swift=swift.slice(0,swift.indexOf(marker)).trimEnd();
swift+='\n'+await readFile('runtime/TikiTakaViewController.swift','utf8');
await writeFile(delegate,swift);
const storyboard='ios/App/App/Base.lproj/Main.storyboard';
let xml=await readFile(storyboard,'utf8');
if(xml.includes('customClass="CAPBridgeViewController"')){
  xml=xml.replace('customClass="CAPBridgeViewController" customModule="Capacitor"','customClass="TikiTakaViewController" customModule="App" customModuleProvider="target"');
  if(xml.includes('customClass="CAPBridgeViewController"'))throw new Error('La plantilla iOS ha cambiado: revisar el controlador');
}
if(!xml.includes('customClass="TikiTakaViewController"'))throw new Error('No se pudo configurar la zona segura');
await writeFile(storyboard,xml);
const sceneFile='ios/App/App/SceneDelegate.swift';
let scene=await readFile(sceneFile,'utf8');
scene=scene.replace('rootViewController = CAPBridgeViewController()','rootViewController = TikiTakaViewController()');
if(!scene.includes('rootViewController = TikiTakaViewController()'))throw new Error('Revisar la creación de la escena iPhone');
await writeFile(sceneFile,scene);
await copyFile('runtime/LaunchScreen.storyboard','ios/App/App/Base.lproj/LaunchScreen.storyboard');
const plist='ios/App/App/Info.plist';
run('/usr/libexec/PlistBuddy',['-c','Set :CFBundleDisplayName Tiki Taka',plist]);
run('/usr/libexec/PlistBuddy',['-c','Set :CFBundleDevelopmentRegion es',plist]);
run('/usr/libexec/PlistBuddy',['-c','Delete :UISupportedInterfaceOrientations',plist]);
run('/usr/libexec/PlistBuddy',['-c','Add :UISupportedInterfaceOrientations array',plist]);
run('/usr/libexec/PlistBuddy',['-c','Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait',plist]);
let pbx=await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8');
pbx=pbx.replaceAll('TARGETED_DEVICE_FAMILY = "1,2";','TARGETED_DEVICE_FAMILY = 1;');
await writeFile('ios/App/App.xcodeproj/project.pbxproj',pbx);
// Reuse the existing brand icon and flatten it to an opaque 1024px App Store icon.
const icon='ios/App/App/Assets.xcassets/AppIcon.appiconset';
run('sips',['-s','format','jpeg','-z','1024','1024','www/icons/icon-maskable-512.png','--out',path.join(project,'icon-flat.jpg')]);
run('sips',['-s','format','png','icon-flat.jpg','--out',icon+'/AppIcon-1024.png']);
await writeFile(icon+'/Contents.json',JSON.stringify({images:[{filename:'AppIcon-1024.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2));
run('npx',['--no-install','cap','sync','ios']);
// Keep native Swift and JavaScript on the same exact Capacitor version.
const nativePackage='ios/App/CapApp-SPM/Package.swift';
const versions=JSON.parse(await readFile('package.json','utf8'));
const capacitorVersion=versions.dependencies['@capacitor/ios'];
let packageText=await readFile(nativePackage,'utf8');
let matched=0;
packageText=packageText.split('\n').map(line=>{
  if(!line.includes('.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git"'))return line;
  matched++;
  return '        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "'+capacitorVersion+'")';
}).join('\n');
if(matched!==1)throw new Error('Revisar el paquete Swift de Capacitor');
await writeFile(nativePackage,packageText);
run('python3',['-c','import plistlib,sys; p=sys.argv[1]; d=plistlib.load(open(p,"rb")); d["UIUserInterfaceStyle"]="Light"; d["NSCameraUsageDescription"]="La cámara se usa solo si eliges hacer una foto para subir una imagen."; d["NSPhotoLibraryUsageDescription"]="Permite elegir una foto cuando subes imágenes al catálogo o a las encuestas."; plistlib.dump(d,open(p,"wb"))',plist]);
const buildNumber=process.env.TIKITAKA_BUILD_NUMBER||'1';
if(!buildNumber.split('').every(c=>c>='0'&&c<='9'))throw new Error('Número de compilación inválido');
pbx=await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8');
pbx=pbx.split('\n').map(line=>{
  for(const [key,value] of [['MARKETING_VERSION',versions.version],['CURRENT_PROJECT_VERSION',buildNumber]]){
    if(line.includes(key+' = '))return line.slice(0,line.indexOf(key))+key+' = '+value+';';
  }
  return line;
}).join('\n');
await writeFile('ios/App/App.xcodeproj/project.pbxproj',pbx);
console.log('Proyecto iPhone preparado. La firma de Apple se configura antes de TestFlight.');
