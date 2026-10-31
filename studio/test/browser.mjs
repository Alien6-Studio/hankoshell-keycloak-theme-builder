import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {mkdir} from 'node:fs/promises';
const require=createRequire(new URL('../../package.json',import.meta.url));const{chromium}=require('playwright');
const output=new URL('../../.theme-kit/studio-qualification/',import.meta.url);await mkdir(output,{recursive:true});
const base=process.env.STUDIO_URL||'http://127.0.0.1:7425';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1512,height:1100}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/?locale=fr');await page.locator('.gallery-card').first().waitFor();
 assert.equal(await page.locator('.gallery-card').count(),16);
 await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Haven',exact:true})}).getByRole('button',{name:'Explore',exact:true}).click();
 await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('navigation',{name:'Template screens'}).getByRole('button',{name:'Security',exact:true}).click();
 await page.getByRole('button',{name:'Configurer le MFA',exact:true}).click();await page.locator('.authenticator-qr').waitFor();
 await page.getByRole('button',{name:'Close template preview'}).click();
 await page.getByRole('textbox',{name:'Search templates'}).fill('Civic');
 assert.equal(await page.locator('.gallery-card').count(),1);
 await page.getByRole('textbox',{name:'Search templates'}).fill('Signal');
 await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Signal',exact:true})}).getByRole('button',{name:'Explore',exact:true}).click();
 await page.getByRole('dialog').locator('.theme-page').waitFor();
 assert.equal(await page.getByRole('dialog').locator('.theme-page').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(20, 20, 20)');
 await page.getByRole('button',{name:'Close template preview'}).click();
 await page.getByLabel('Keep existing screen content',{exact:true}).uncheck();
 await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Signal',exact:true})}).getByRole('button',{name:'Use this theme'}).click();
 await page.locator('.template-gallery').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
 await page.waitForFunction(async()=>new Promise(resolve=>{const r=indexedDB.open('hanko-theme-studio');r.onsuccess=()=>{const g=r.result.transaction('projects').objectStore('projects').get('draft');g.onsuccess=()=>{r.result.close();resolve(Object.keys(g.result?.document.pages||{}).length===18);};};}));
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le projet',exact:true}).click();
 const {readFile}=await import('node:fs/promises');const project=JSON.parse(await readFile(await(await download).path(),'utf8'));
 for(const [key,screen] of Object.entries(project.pages)){
  assert.equal(screen.preset,'signal');assert.equal(screen.appearance.background,'#141414');
  assert.equal(screen.native.buttonColor,'#000000');assert.equal(screen.i18n.supportedLocales.length,8);
 }
 assert.equal(project.pages['login:0'].appearance.composition,'signal','The applied composition matches its preview');
 assert.equal(project.baseTheme,undefined,'Exported projects are independent of catalogue inheritance');
 await page.getByRole('button',{name:'Enregistrer comme modèle'}).click();await page.getByRole('dialog').getByRole('textbox').fill('My Signal identity');await page.getByRole('dialog').getByRole('button',{name:'Enregistrer le modèle',exact:true}).click();
 await page.getByRole('dialog').waitFor({state:'detached'});await page.getByRole('button',{name:'Modèles',exact:true}).click();await page.getByRole('tab',{name:'My templates'}).click();await page.getByRole('heading',{name:'My Signal identity'}).waitFor();
 await page.reload();await page.getByRole('tab',{name:'My templates'}).click();await page.getByRole('heading',{name:'My Signal identity'}).waitFor();
 await page.getByRole('button',{name:'Back to Studio',exact:true}).click();
 await page.screenshot({path:new URL('standalone.png',output).pathname,fullPage:true});
 await page.goto(base+'/test/host.html?slow-validation');await page.locator('.gallery-card').first().waitFor();
 assert.equal(await page.locator('#outside').evaluate(node=>getComputedStyle(node).color),'rgb(23, 36, 59)');assert.equal(await page.locator('body').evaluate(node=>getComputedStyle(node).fontSize),'14px');
 assert.equal(await page.locator('.hanko-theme-studio').evaluate(node=>getComputedStyle(node).containerType),'inline-size');
 assert.equal(await page.locator('main main').count(),0);
 await page.screenshot({path:new URL('embedded-gallery.png',output).pathname,fullPage:true});
 let releaseValidation;
 const validationGate=new Promise(resolve=>{releaseValidation=resolve;});
 await page.route('**/__studio/contracts/validate',async route=>{await validationGate;await route.continue();});
 try {
  await page.locator('.gallery-card').first().getByRole('button',{name:'Use this theme'}).click();
  assert.equal(await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),true,'A pending template must not save the previous project');
  assert.equal(await page.getByRole('button',{name:'Publish',exact:true}).isDisabled(),true,'A pending template must not publish the previous project');
  assert.equal(await page.evaluate(()=>window.saved),undefined);
 } finally { releaseValidation(); }
 await page.locator('.template-gallery').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(()=>window.saved&&Object.keys(window.saved.pages).length===18);
 await page.getByRole('combobox',{name:'Type de thème'}).click();await page.getByRole('option',{name:'Compte',exact:true}).click();await page.getByRole('navigation',{name:'Arborescence des écrans'}).getByRole('button',{name:'Sécurité',exact:true}).click();
 await page.setViewportSize({width:1000,height:1000});await page.screenshot({path:new URL('embedded-editor.png',output).pathname,fullPage:true});
 await page.goto(base+'/test/host.html?empty');await page.getByRole('combobox',{name:'Type de thème'}).waitFor();
 assert.equal(errors.length,0,errors.join('\n'));console.log('Browser checks passed: catalogue, live MFA preview, 18-page apply, local save/reload, personal templates, scoped embedded CSS and shadcn navigation.');
}finally{await browser.close();}
