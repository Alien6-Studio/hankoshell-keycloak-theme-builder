import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {mkdir} from 'node:fs/promises';
const require=createRequire(new URL('../../package.json',import.meta.url));const{chromium}=require('playwright');
const output=new URL('../../.theme-kit/studio-qualification/',import.meta.url);await mkdir(output,{recursive:true});
const base=process.env.STUDIO_URL||'http://127.0.0.1:7425';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1512,height:1100}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/');await page.getByRole('button',{name:'Modèles',exact:true}).waitFor();
 assert.equal(await page.locator('.gallery-card').count(),3);
 await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Éditorial',exact:true})}).getByRole('button',{name:'Explorer',exact:true}).click();
 await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Sécurité',exact:true}).click();
 await page.getByRole('button',{name:'Configurer le MFA',exact:true}).click();await page.locator('.authenticator-qr').waitFor();
 await page.getByRole('button',{name:'Fermer l’aperçu du modèle'}).click();
 await page.getByLabel('Conserver les contenus des écrans existants',{exact:true}).click();
 await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Minuit',exact:true})}).getByRole('button',{name:'Utiliser ce thème'}).click();
 await page.locator('.template-gallery').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
 await page.waitForFunction(async()=>new Promise(resolve=>{const r=indexedDB.open('hanko-theme-studio');r.onsuccess=()=>{const g=r.result.transaction('projects').objectStore('projects').get('draft');g.onsuccess=()=>{r.result.close();resolve(Object.keys(g.result?.document.pages||{}).length===18);};};}));
 await page.getByRole('button',{name:'Enregistrer comme modèle'}).click();await page.getByRole('dialog').getByRole('textbox').fill('Mon identité Minuit');await page.getByRole('dialog').getByRole('button',{name:'Enregistrer le modèle',exact:true}).click();
 await page.getByRole('dialog').waitFor({state:'detached'});await page.getByRole('button',{name:'Modèles',exact:true}).click();await page.getByRole('tab',{name:'Mes modèles'}).click();await page.getByRole('heading',{name:'Mon identité Minuit'}).waitFor();
 await page.reload();await page.getByRole('tab',{name:'Mes modèles'}).click();await page.getByRole('heading',{name:'Mon identité Minuit'}).waitFor();
 await page.getByRole('button',{name:'Retour au Studio',exact:true}).click();
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
  await page.locator('.gallery-card').first().getByRole('button',{name:'Utiliser ce thème'}).click();
  assert.equal(await page.getByRole('button',{name:'Enregistrer',exact:true}).isDisabled(),true,'A pending template must not save the previous project');
  assert.equal(await page.getByRole('button',{name:'Publication',exact:true}).isDisabled(),true,'A pending template must not publish the previous project');
  assert.equal(await page.evaluate(()=>window.saved),undefined);
 } finally { releaseValidation(); }
 await page.locator('.template-gallery').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(()=>window.saved&&Object.keys(window.saved.pages).length===18);
 await page.getByRole('combobox',{name:'Type de thème'}).click();await page.getByRole('option',{name:'Compte',exact:true}).click();await page.getByRole('navigation',{name:'Arborescence des écrans'}).getByRole('button',{name:'Sécurité',exact:true}).click();
 await page.setViewportSize({width:1000,height:1000});await page.screenshot({path:new URL('embedded-editor.png',output).pathname,fullPage:true});
 await page.goto(base+'/test/host.html?empty');await page.getByRole('combobox',{name:'Type de thème'}).waitFor();
 assert.equal(errors.length,0,errors.join('\n'));console.log('Browser checks passed: catalogue, live MFA preview, 18-page apply, local save/reload, personal templates, scoped embedded CSS and shadcn navigation.');
}finally{await browser.close();}
