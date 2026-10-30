import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {build} from 'esbuild';import {staticServer} from './static-server.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),platform=resolve(root,'../../hanko-platform');
const require=createRequire(resolve(root,'../package.json'));const{chromium}=require('playwright');const out=resolve(root,'artifacts/dashboard-host');await mkdir(out,{recursive:true});
const page=JSON.parse(await readFile(resolve(root,'catalog/themes/essential/pages/login.json'),'utf8'));
const messages=JSON.parse(await readFile(resolve(platform,'packages/dashboard/messages/fr/themeStudio.json'),'utf8'));
const shims={
 'next/dynamic':`import React,{lazy,Suspense}from'react';export default loader=>{const Component=lazy(()=>loader().then(value=>({default:value})));return props=>React.createElement(Suspense,{fallback:'Loading'},React.createElement(Component,props));};`,
 'next-intl':`const messages=${JSON.stringify(messages)};export const useLocale=()=>'fr';export const useTranslations=()=>key=>messages[key]||key;`,
 '@/components/error-banner':`import React from'react';export const ErrorBanner=({error})=>error?React.createElement('p',{role:'alert'},error):null;`,
};
const project={format:'hanko.theme-studio.project/v1',name:'alpha',pages:{'login:0':page},media:[],destination:{mode:'hanko',url:'',realm:'alpha',scope:'realm',client:'',theme:'alpha'},publication:{status:'draft',built:false,deployed:false,attached:false}};
const source=`import React,{useState}from'react';import{createRoot}from'react-dom/client';import{ThemeStudioClient}from ${JSON.stringify(resolve(platform,'packages/dashboard/components/theme-studio-client.tsx'))};
const initial=${JSON.stringify(project)};function Host(){const[realm,setRealm]=useState('alpha');const document=structuredClone(initial);document.name=realm;document.destination.realm=realm;document.pages['login:0'].brand.name=realm;return <><button id="beta" onClick={()=>setRealm('beta')}>Organisation Beta</button><button id="failed" onClick={()=>setRealm('failed')}>Chargement indisponible</button><ThemeStudioClient context={{kind:'organization',clusterId:'local',backendId:'default',realm}} apiBase={'/api/theme-studio/organization/local/default/'+realm+'/projects'} state={{project:realm==='failed'?null:document,revision:realm==='alpha'?1:7,templates:[],builds:[],publicationAvailable:true,loadFailed:realm==='failed'}}/></>;}createRoot(document.getElementById('root')).render(<Host/>);`;
await build({stdin:{contents:source,loader:'tsx',resolveDir:root},bundle:true,format:'esm',platform:'browser',outfile:resolve(out,'host.js'),define:{'process.env.NODE_ENV':'"production"'},alias:{react:resolve(root,'node_modules/react'),'react-dom':resolve(root,'node_modules/react-dom')},plugins:[{name:'host-environment',setup(builder){builder.onResolve({filter:/^(next\/dynamic|next-intl|@\/components\/error-banner)$/},args=>({path:args.path,namespace:'host-shim'}));builder.onLoad({filter:/.*/,namespace:'host-shim'},args=>({contents:shims[args.path],resolveDir:root}));builder.onResolve({filter:/^@alien6\/hankoshell-theme-studio(?:\/styles.css)?$/},args=>({path:resolve(root,args.path.endsWith('.css')?'dist/studio.css':'dist/index.js')}));}}]});
await writeFile(resolve(out,'index.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><title>Dashboard host qualification</title><link rel="stylesheet" href="./host.css"><div id="root"></div><script type="module" src="./host.js"></script></html>');
const server=await staticServer(out),browser=await chromium.launch();
try{const context=await browser.newContext(),view=await context.newPage();const writes=[],errors=[];view.on('pageerror',error=>errors.push(error.message));
 await view.route('**/api/theme-studio/contracts/validate',route=>{const payload=route.request().postDataJSON();const contracts=createRequire(import.meta.url)('../dist/contracts.cjs');return route.fulfill({json:contracts.validate(payload.kind,payload.document)});});
 await view.route('**/api/theme-studio/organization/**/projects/draft',route=>{const body=route.request().postDataJSON();writes.push({path:new URL(route.request().url()).pathname,revision:body.revision,brand:body.document.pages['login:0'].brand.name});return route.fulfill({json:{revision:body.revision+1}});});
 let installed=false,assigned=false,restored=false;const publicationRequests=[];
 let receipt={id:'build-1',projectRevision:9,projectSha256:'a'.repeat(64),themeName:'studio-beta-build',types:['login'],phase:'Building',attachment:'none',destination:{},createdAt:'2026-10-30T10:00:00Z',updatedAt:'2026-10-30T10:00:00Z'};
 await view.route('**/api/theme-studio/organization/**/projects/builds**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()==='POST'){
   const body=request.postDataJSON();publicationRequests.push({path,body,authorization:request.headers().authorization});
   if(path.endsWith('/attach'))receipt={...receipt,destination:body,attachment:'attaching'};
   else if(path.endsWith('/rollback'))receipt={...receipt,attachment:'rolling_back'};
  }else{
   if(installed)receipt={...receipt,phase:'Ready'};
   if(assigned&&receipt.attachment==='attaching')receipt={...receipt,attachment:'attached'};
   if(restored&&receipt.attachment==='rolling_back')receipt={...receipt,attachment:'rolled_back'};
  }
  return route.fulfill({json:receipt});
 });
 await view.goto(server.url);await view.getByRole('textbox',{name:'Modifier le nom de la marque'}).waitFor();assert.equal(await view.getByRole('textbox',{name:'Modifier le nom de la marque'}).textContent(),'alpha');await view.getByRole('button',{name:'Enregistrer',exact:true}).click();await view.waitForFunction(()=>document.querySelector('.studio-footer')?.textContent.includes('Projet enregistré.'));
 await view.locator('#beta').click();await view.getByRole('textbox',{name:'Modifier le nom de la marque'}).filter({hasText:'beta'}).waitFor();await view.getByRole('button',{name:'Enregistrer',exact:true}).click();await view.waitForFunction(()=>document.querySelector('.studio-footer')?.textContent.includes('Projet enregistré.'));
 assert.deepEqual(writes,[{path:'/api/theme-studio/organization/local/default/alpha/projects/draft',revision:1,brand:'alpha'},{path:'/api/theme-studio/organization/local/default/beta/projects/draft',revision:7,brand:'beta'}]);
 await view.getByRole('button',{name:'Publication',exact:true}).click();await view.getByRole('button',{name:'Préparer la construction',exact:true}).click();await view.getByRole('button',{name:'Construire et installer',exact:true}).click();
 await view.getByRole('heading',{name:'Construction en cours',exact:true}).waitFor();assert.equal(await view.getByRole('button',{name:'Choisir l’affectation',exact:true}).isDisabled(),true);
 assert.equal(writes.at(-1).revision,8);assert.equal(publicationRequests[0].body.revision,9,'Build freezes the revision returned by the preceding save');assert.equal(publicationRequests[0].authorization,undefined,'Browser never receives a bearer credential');
 installed=true;await view.getByRole('button',{name:'Actualiser le statut',exact:true}).click();await view.getByRole('heading',{name:'Thème installé et vérifié',exact:true}).waitFor();await view.getByRole('button',{name:'Choisir l’affectation',exact:true}).click();
 assert.equal(await view.getByRole('textbox',{name:'Realm de destination',exact:true}).isDisabled(),true);await view.getByRole('button',{name:'Affecter cette version',exact:true}).click();await view.getByRole('heading',{name:'Affectation demandée · vérification Keycloak en cours',exact:true}).waitFor();assert.equal(await view.getByRole('button',{name:'Revenir à la version précédente',exact:true}).count(),0);
 assigned=true;await view.getByRole('button',{name:'Actualiser le statut',exact:true}).click();await view.getByRole('button',{name:'Revenir à la version précédente',exact:true}).click();await view.getByRole('heading',{name:'Retour à la version précédente en cours',exact:true}).waitFor();restored=true;await view.getByRole('button',{name:'Actualiser le statut',exact:true}).click();await view.getByRole('heading',{name:'Version précédente rétablie dans Keycloak',exact:true}).waitFor();
 assert.deepEqual(publicationRequests.find(item=>item.path.endsWith('/attach')).body,{realm:'beta',scope:'realm',client:'',types:['login']});assert.deepEqual(publicationRequests.find(item=>item.path.endsWith('/rollback')).body,{});
 await view.getByRole('button',{name:'Revenir à l’éditeur',exact:true}).click();assert.equal(await view.locator('.studio-footer').getAttribute('data-dirty'),'false');
 await view.locator('#failed').click();await view.getByRole('alert').waitFor();assert.equal(await view.getByRole('button',{name:'Enregistrer',exact:true}).count(),0);assert.equal(writes.length,3);assert.deepEqual(errors,[]);console.log('Actual Dashboard client passed: organization switch resets project and revision; load failure disables writes; publication freezes revisions and waits for installation/assignment/rollback observations.');
}finally{await browser.close();await server.close();}
