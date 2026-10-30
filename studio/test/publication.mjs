import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {staticServer} from './static-server.mjs';
import {AxeBuilder} from '@axe-core/playwright';
const require=createRequire(new URL('../../package.json',import.meta.url));
const engines=require('playwright'),contracts=createRequire(import.meta.url)('../dist/contracts.cjs');
const output=new URL('../artifacts/qualification/',import.meta.url);await mkdir(output,{recursive:true});
const server=await staticServer(fileURLToPath(new URL('../site',import.meta.url)));
const png=await readFile(new URL('../catalog/themes/essential/assets/identity.png',import.meta.url));
const report={version:JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version,date:new Date().toISOString(),checks:[],accessibility:[]};
async function exported(page){const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le projet',exact:true}).click();return JSON.parse(await readFile(await(await waiting).path(),'utf8'));}
const minimal={format:'hanko.theme-studio.project/v1',name:'empty',pages:{'login:0':{blocks:[]}},media:[],destination:{mode:'standalone',url:'',realm:'',scope:'realm',client:'',theme:'empty'},publication:{status:'draft',built:false,deployed:false,attached:false}};
const catalogue=JSON.parse(await readFile(new URL('../catalog/themes.json',import.meta.url),'utf8'));
async function importProject(page,document){await page.getByRole('button',{name:'JSON',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('tab',{name:'Projet',exact:true}).click();await dialog.getByRole('textbox',{name:'Document JSON'}).fill(JSON.stringify(document));await dialog.getByRole('button',{name:'Importer le projet',exact:true}).click();await dialog.waitFor({state:'detached'});}
try{
 for(const name of (process.env.STUDIO_BROWSERS||'chromium,firefox,webkit').split(',')){
  console.log('Qualifying '+name);const browser=await engines[name].launch({headless:true,timeout:20000});
  try{
   const context=await browser.newContext({viewport:{width:1512,height:1100}}),page=await context.newPage();const errors=[],requests=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('request',request=>requests.push(request.url()));
   await page.goto(server.url);await page.locator('.gallery-card').first().waitFor();assert.equal(await page.locator('.gallery-card').count(),23);
   const xmlResponse=await page.request.get(new URL('sitemap.xml',server.url).href);assert.equal(xmlResponse.status(),200);const sitemap=await xmlResponse.text();const parsed=await page.evaluate(xml=>{const doc=new DOMParser().parseFromString(xml,'application/xml');return{errors:doc.querySelectorAll('parsererror').length,screens:doc.getElementsByTagName('screen').length,parent:[...doc.getElementsByTagName('screen')].find(node=>node.getAttribute('id')==='account:3')?.getAttribute('parent')};},sitemap);assert.deepEqual(parsed,{errors:0,screens:18,parent:'account:1'});
   await page.getByRole('textbox',{name:'Rechercher un modèle'}).fill('Midnight');assert.equal(await page.locator('.gallery-card').count(),1);await page.getByRole('textbox',{name:'Rechercher un modèle'}).fill('');
   await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Editorial',exact:true})}).getByRole('button',{name:'Utiliser ce thème'}).click();await page.locator('.template-gallery').waitFor({state:'detached'});
   assert.equal(await page.getByRole('combobox',{name:'Écran',exact:true}).count(),0,'Screen navigation has no duplicate dropdown');
   assert.equal(await page.locator('.screen-breadcrumb').count(),0,'Screen navigation has no duplicate breadcrumb');
   assert.equal(await page.locator('.canvas-area>.canvas-caption').count(),0,'Canvas does not repeat the screen path');
   const screens=page.getByRole('navigation',{name:'Arborescence des écrans',exact:true});
   await screens.getByRole('button',{name:'Code OTP',exact:true}).click();
   assert.equal(await screens.getByRole('button',{name:'Code OTP',exact:true}).getAttribute('aria-current'),'page');
   await page.getByRole('textbox',{name:'Modifier libellé du code otp',exact:true}).waitFor();
   await screens.getByRole('button',{name:'Connexion',exact:true}).click();
   assert.equal(await page.locator('.studio-footer').getAttribute('data-dirty'),'true');
   await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).fill('Identité de qualification');await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).press('Tab');
   await page.getByLabel('Importer des images',{exact:true}).setInputFiles({name:'identite.png',mimeType:'image/png',buffer:png});
   await page.getByRole('status').filter({hasText:'image ajoutée'}).waitFor();
   let document=await exported(page);assert.equal(Object.keys(document.pages).length,18);assert.equal(document.media.length,1);assert.equal(document.pages['login:0'].blocks[0].text,'Identité de qualification');assert.equal(contracts.validate('project',document).valid,true);assert.doesNotMatch(JSON.stringify(document),/otpauth:\/\/|authenticatorSecret/);
   const beforeStyles=structuredClone(document);
   assert.equal(await page.getByRole('tab',{name:'Modèles',exact:true}).count(),0,'Models has one gallery entry, not an editor tab');
   await page.getByRole('tab',{name:'Styles',exact:true}).click();
   const stylePanel=page.getByRole('tabpanel',{name:'Styles',exact:true});
   await stylePanel.getByRole('heading',{name:'Styles de l’écran',exact:true}).waitFor();
   assert.equal(await stylePanel.getByRole('button',{name:/modèle|thème/i}).count(),0,'Styles contains visual settings, not model navigation');
   await stylePanel.getByRole('button',{name:'Palette Forêt',exact:true}).click();
   document=await exported(page);
   assert.equal(document.pages['login:0'].accent,'#21664c');
   assert.deepEqual(document.pages['login:0'].blocks,beforeStyles.pages['login:0'].blocks,'Palette preserves all authored blocks');
   assert.deepEqual(document.pages['login:0'].native.copy,beforeStyles.pages['login:0'].native.copy,'Palette preserves form texts');
   assert.deepEqual(document.pages['login:0'].i18n,beforeStyles.pages['login:0'].i18n,'Palette preserves translations');
   assert.deepEqual(document.media,beforeStyles.media,'Palette preserves media');
   for(const key of Object.keys(document.pages).filter(key=>key!=='login:0'))assert.deepEqual(document.pages[key],beforeStyles.pages[key],'Styles affects only current screen');
   await page.getByRole('button',{name:'Annuler',exact:true}).click();assert.deepEqual((await exported(page)).pages,beforeStyles.pages,'Palette change is undoable');
   await stylePanel.getByRole('combobox',{name:'Police de l’écran',exact:true}).click();await page.getByRole('option',{name:'Verdana · lisible',exact:true}).click();
   assert.equal((await exported(page)).pages['login:0'].appearance.font,'Verdana, sans-serif');
   await page.getByRole('button',{name:'Annuler',exact:true}).click();
   await page.getByRole('button',{name:'Modèles',exact:true}).click();await page.locator('.gallery-card').first().waitFor();
   await page.getByRole('button',{name:'Retour au Studio',exact:true}).click();await stylePanel.waitFor();
   assert.deepEqual((await exported(page)).pages,beforeStyles.pages,'Gallery round trip preserves current composition');
   await page.getByRole('tab',{name:'Médias',exact:true}).click();await page.getByRole('button',{name:'Retirer identite.png de la médiathèque',exact:true}).click();assert.equal((await exported(page)).media.length,0);await page.getByRole('button',{name:'Annuler',exact:true}).click();assert.equal((await exported(page)).media.length,1);
   await page.getByRole('tab',{name:'Blocs',exact:true}).click();
   const transfer=await page.evaluateHandle(()=>{const data=new DataTransfer();data.setData('application/x-theme-studio',JSON.stringify({type:'heading'}));return data;});const count=(await exported(page)).pages['login:0'].blocks.length;await page.locator('.canvas-zone.zone-footer').dispatchEvent('drop',{dataTransfer:transfer});assert.equal((await exported(page)).pages['login:0'].blocks.length,count+1);await page.getByRole('button',{name:'Annuler',exact:true}).click();assert.equal((await exported(page)).pages['login:0'].blocks.length,count);
   await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.studio-footer')?.dataset.dirty==='false');
   await page.getByRole('button',{name:'Enregistrer comme modèle'}).click();await page.getByRole('dialog').getByRole('textbox',{name:'Nom du modèle'}).fill('Identité test');await page.getByRole('dialog').getByRole('button',{name:'Enregistrer le modèle',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});
   await importProject(page,minimal);await page.getByRole('button',{name:'Modèles',exact:true}).click();await page.getByRole('tab',{name:'Mes modèles',exact:true}).click();await page.getByRole('button',{name:'Utiliser ce modèle',exact:true}).click();await page.locator('.template-gallery').waitFor({state:'detached'});document=await exported(page);assert.equal(document.media.length,1,'Personal template restores its media library');
   await page.getByRole('combobox',{name:'Langue de l’écran',exact:true}).click();await page.getByRole('option',{name:'עברית',exact:true}).click();await page.locator('.theme-page[lang=he][dir=rtl]').waitFor();
   await page.getByRole('combobox',{name:'Langue de l’écran',exact:true}).click();await page.getByRole('option',{name:'Français',exact:true}).click();
   await page.getByRole('button',{name:'Traductions',exact:true}).click();await page.locator('.translation-workspace').waitFor();await page.getByRole('button',{name:'Retour au Studio',exact:true}).click();
   const assignment=await exported(page);assignment.destination.scope='client';assignment.destination.client='client-test';await importProject(page,assignment);await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.studio-footer')?.dataset.dirty==='false');
   await page.getByRole('button',{name:'Plan',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Profil',exact:true}).click();const originalTitle=await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).textContent();await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).fill('Titre inter-page');await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).press('Tab');await page.getByRole('button',{name:'Plan',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Authentification à deux facteurs',exact:true}).click();await page.getByRole('button',{name:'Annuler',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).textContent(),originalTitle);await page.getByRole('button',{name:'Rétablir',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).textContent(),'Titre inter-page');await page.getByRole('button',{name:'Annuler',exact:true}).click();await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.studio-footer')?.dataset.dirty==='false');
   await page.getByRole('button',{name:'Plan',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Authentification à deux facteurs',exact:true}).click();await page.locator('.screen-secondary button[aria-current=page]').filter({hasText:'Authentification'}).waitFor();assert.equal(await page.locator('.screen-primary button[aria-current=location]').textContent(),'Sécurité');assert.equal(await page.locator('.studio-footer').getAttribute('data-dirty'),'false','Navigation does not mark the project dirty');assert.equal((await exported(page)).destination.scope,'client','Navigation preserves publication assignment');await page.getByRole('combobox',{name:'Type de thème',exact:true}).click();await page.getByRole('option',{name:'Connexion',exact:true}).click();
   await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.studio-footer')?.dataset.dirty==='false');await page.reload();await page.getByRole('button',{name:'Retour au Studio',exact:true}).click();document=await exported(page);assert.equal(document.media.length,1);
   const invalid=structuredClone(document);invalid.pages['login:0'].blocks.push({id:'bad',type:'button',zone:'aside',text:'Bad',href:'javascript:alert(1)'});await page.getByRole('button',{name:'JSON',exact:true}).click();await page.getByRole('dialog').getByRole('tab',{name:'Projet',exact:true}).click();await page.getByRole('dialog').getByRole('textbox',{name:'Document JSON'}).fill(JSON.stringify(invalid));await page.getByRole('dialog').getByRole('button',{name:'Importer le projet',exact:true}).click();await page.getByRole('dialog').locator('.json-validation[data-valid=false]').filter({hasText:'pattern'}).waitFor();await page.getByRole('button',{name:'Fermer les contrats JSON'}).click();assert.equal((await exported(page)).media.length,1);
   await page.getByRole('button',{name:'3 Construire',exact:true}).click();await page.locator('.publication-command').waitFor();assert.match(await page.locator('.publication-command').textContent(),/hanko-theme build-project .*\.studio\.json/);assert.equal(await page.getByRole('button',{name:'Construire et installer',exact:true}).count(),0,'Standalone publication requires its CLI, without fabricated deployment state');
   await page.getByRole('button',{name:'4 Déployer',exact:true}).click();await page.getByRole('heading',{name:'Installer le JAR compilé',exact:true}).waitFor();await page.getByRole('button',{name:'Revenir à l’éditeur',exact:true}).click();
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:new URL(name+'-mobile.png',output).pathname,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No mobile page overflow');
   assert.equal(requests.filter(url=>!url.startsWith(new URL(server.url).origin)).length,0,'No external network request');assert.equal(requests.filter(url=>url.includes('/__studio/')||url.includes('/api/')).length,0,'No development or backend API required');assert.equal(errors.length,0,errors.join('\n'));
    report.checks.push({browser:name,version:browser.version(),status:'passed',coverage:['sitemap-XML','hierarchical-navigation','single-screen-navigation','cross-page-undo','static-subpath','strict-script-CSP','catalogue','screen-style-controls','styles-preserve-content','single-model-gallery-entry','live-editing','media-upload','media-remove-undo','drag-drop-undo','JSON-export-import','personal-template-media','saved-reload','RTL','translations','invalid-input-rejection','mobile-layout']});
    if(name==='chromium'){
     const preview=await context.newPage();
     for(const theme of catalogue.themes.filter(theme=>theme.baseTheme)){
      await preview.goto(server.url+'?preview='+theme.id);
      const frame=preview.locator('[data-hanko-frame]');await frame.waitFor();
      assert.equal(await frame.getAttribute('data-hanko-frame'),theme.style.composition);
      for(const width of [1512,390]){
       await preview.setViewportSize({width,height:1100});
       assert.equal(await preview.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,theme.id+' viewport '+width);
       const aside=await frame.locator('[data-hanko-slot=aside]').boundingBox(),form=await frame.locator('[data-hanko-slot=form]').boundingBox();
       if(aside&&form&&aside.width>0&&aside.height>0){
        const overlap=Math.max(0,Math.min(aside.x+aside.width,form.x+form.width)-Math.max(aside.x,form.x))*Math.max(0,Math.min(aside.y+aside.height,form.y+form.height)-Math.max(aside.y,form.y));
        assert.ok(overlap<1,theme.id+' content must not overlap its form at '+width);
       }
      }
     }
     await preview.close();report.checks.at(-1).coverage.push('20-live-compositions','desktop-and-mobile','no-content-form-overlap');
    }
   await context.close();
   if(name==='chromium'){
    const audit=await browser.newContext({bypassCSP:true,viewport:{width:1512,height:1100}}),view=await audit.newPage();await view.goto(server.url);await view.locator('.gallery-card').first().waitFor();
    for(const state of ['gallery','editor','styles','translations','publication']){
     if(state==='editor'){await view.locator('.gallery-card').first().getByRole('button',{name:'Utiliser ce thème'}).click();await view.locator('.template-gallery').waitFor({state:'detached'});}
     if(state==='styles'){await view.getByRole('tab',{name:'Styles',exact:true}).click();await view.getByRole('heading',{name:'Styles de l’écran',exact:true}).waitFor();}
     if(state==='translations'){await view.getByRole('button',{name:'Traductions',exact:true}).click();await view.locator('.translation-workspace').waitFor();}
     if(state==='publication'){await view.getByRole('button',{name:'Retour au Studio',exact:true}).click();await view.getByRole('button',{name:'3 Construire',exact:true}).click();await view.locator('.publication-command').waitFor();}
     const result=await new AxeBuilder({page:view}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();report.accessibility.push({state,violations:result.violations.map(item=>({id:item.id,impact:item.impact,description:item.description,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))}))});
    }
    await audit.close();
   }
  }finally{await browser.close();}
 }
 await writeFile(new URL('results.json',output),JSON.stringify(report,null,2)+'\n');
 const serious=report.accessibility.flatMap(state=>state.violations.filter(item=>['critical','serious'].includes(item.impact)).map(item=>({state:state.state,id:item.id,nodes:item.nodes.length})));
 assert.equal(serious.length,0,JSON.stringify(serious));console.log(JSON.stringify({browsers:report.checks.map(check=>check.browser),accessibility:report.accessibility.map(check=>({state:check.state,violations:check.violations.length})),status:'passed'}));
}catch(error){await writeFile(new URL('results.json',output),JSON.stringify({...report,error:String(error)},null,2)+'\n');throw error;}finally{await server.close();}
