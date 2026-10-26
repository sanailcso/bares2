import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const project=fileURLToPath(new URL('../',import.meta.url));
const root=fileURLToPath(new URL('../../../',import.meta.url));
const out=path.join(project,'www');
export async function buildWeb(source=root,destination=out){
  // Allowlist only public client assets. Never package databases, keys, tests or admin exports.
  await rm(destination,{recursive:true,force:true});
  await mkdir(destination,{recursive:true});
  for(const dir of ['assets','icons','img']) await cp(path.join(source,dir),path.join(destination,dir),{recursive:true});
  let html=await readFile(path.join(source,'index.html'),'utf8');
  html=html.replace(/<link rel="manifest"[^>]*>/g,'');
  if(!html.includes('</head>'))throw new Error('La web no tiene cabecera HTML');
  html=html.replace('</head>','<link rel="stylesheet" href="./assets/native-ios.css">\n<script src="./assets/native-ios.js"></script>\n</head>');
  await writeFile(path.join(destination,'index.html'),html);
  let app=await readFile(path.join(destination,'assets/app.js'),'utf8');
  const pwa='(function(){\n  if("serviceWorker" in navigator)';
  if(!app.includes(pwa))throw new Error('Revisar el bloque de instalación web antes de empaquetar iPhone');
  app=app.replace(pwa,'(function(){\n  if(window.__TK_NATIVE_IOS__) return;\n  if("serviceWorker" in navigator)');
  await writeFile(path.join(destination,'assets/app.js'),app);
  await cp(path.join(project,'runtime/native-ios.js'),path.join(destination,'assets/native-ios.js'));
  await cp(path.join(project,'runtime/native-ios.css'),path.join(destination,'assets/native-ios.css'));
  return destination;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await buildWeb();console.log('Interfaz de iPhone preparada con recursos locales.');}
