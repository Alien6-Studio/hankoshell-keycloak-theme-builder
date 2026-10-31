import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {staticServer} from './static-server.mjs';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright');
import {catalogue,pageTemplates} from '@alien6/hankoshell-theme-catalog';
const out=new URL('../../.theme-kit/catalog-coherence/',import.meta.url);await mkdir(out,{recursive:true});
const server=await staticServer(fileURLToPath(new URL('../site',import.meta.url)));
const browser=await chromium.launch({headless:true});
const checks=[];
async function snapshot(frame){await frame.evaluate(node=>Promise.all(node.getAnimations({subtree:true}).filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{}))));return frame.evaluate(node=>{
 const css=getComputedStyle(node),root=node.getBoundingClientRect();
 return {composition:node.dataset.hankoFrame,layout:node.dataset.layout,font:css.fontFamily,displayFont:css.getPropertyValue('--hf-display'),background:css.backgroundColor,color:css.color,
  slots:[...node.querySelectorAll('[data-hanko-slot]')].filter(el=>el.dataset.hankoSlot!=='body').map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {slot:el.dataset.hankoSlot,text:el.textContent.trim().replace(/\s+/g,' '),background:s.backgroundColor,font:s.fontFamily,rect:[r.x-root.x,r.y-root.y,r.width,r.height].map(value=>Math.round(value))};}),
  images:[...node.querySelectorAll('img')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{alt:el.alt,fit:s.objectFit,rect:[r.x-root.x,r.y-root.y,r.width,r.height].map(value=>Math.round(value))};})};
 });}
async function exported(page){const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le projet',exact:true}).click();return JSON.parse(await readFile(await(await waiting).path(),'utf8'));}
try{
 const page=await browser.newPage({viewport:{width:2000,height:1400}}),errors=[];
 page.on('dialog',dialog=>dialog.accept());
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 for(const path of ['?collection=new','design-proposals.html?collection=new']){
  await page.goto(new URL(path,server.url).href);await page.locator('.gallery-card').first().waitFor();
  assert.equal(await page.locator('.template-gallery').getAttribute('lang'),'en');
  await page.getByRole('heading',{name:'Your identity, from the first click.',exact:true}).waitFor();
  assert.equal(await page.locator('.gallery-live-thumbnail .theme-page[lang=en]').count(),catalogue.themes.filter(theme=>theme.design.introduced).length,'Gallery thumbnails use English content by default');
  for(const theme of catalogue.themes.filter(theme=>theme.design.introduced)){const card=page.locator('.gallery-card[data-theme-id='+theme.id+']');await card.getByText(theme.design.title,{exact:true}).waitFor();await card.getByText(theme.design.audience,{exact:true}).waitFor();}
  assert.deepEqual(await page.locator('.gallery-card').evaluateAll(nodes=>nodes.map(node=>node.dataset.themeId)),catalogue.themes.filter(theme=>theme.design.introduced).map(theme=>theme.id),'Old exploration URL and Studio use the same new illustrated themes');
 }
 checks.push('The legacy exploration URL and the Studio gallery use the same catalogue and filters.');
 let themeColors;
 for(const scheme of ['light','dark']){
  await page.emulateMedia({colorScheme:scheme});await page.goto(server.url+'?scheme=system');
  await page.locator(`.hanko-theme-studio[data-theme=${scheme}]`).waitFor();await page.locator('.gallery-card').last().waitFor();await page.evaluate(()=>document.fonts.ready);
  const colors=await page.evaluate(()=>{
   const style=selector=>getComputedStyle(document.querySelector(selector));
   const shell=style('.hanko-theme-studio');
   const themes=[...document.querySelectorAll('.gallery-card')].map(card=>{const frame=card.querySelector('.theme-page'),form=frame.querySelector('[data-hanko-slot=form]'),input=form.querySelector('input');return{id:card.dataset.themeId,color:getComputedStyle(frame).color,background:getComputedStyle(frame).backgroundColor,font:getComputedStyle(frame).fontFamily,scheme:getComputedStyle(frame).colorScheme,form:{color:getComputedStyle(form).color,background:getComputedStyle(form).backgroundColor,scheme:getComputedStyle(form).colorScheme,placeholder:getComputedStyle(input,'::placeholder').color}};});
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d');
   const lum=color=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);const bytes=context.getImageData(0,0,1,1).data;return[...bytes].slice(0,3).reduce((sum,channel,index)=>{const s=channel/255,v=s<=.04045?s/12.92:((s+.055)/1.055)**2.4;return sum+v*[.2126,.7152,.0722][index];},0);};
   const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
   return{root:shell.color,heading:style('.gallery-heading h1').color,brand:style('.studio-brand strong').color,headerContrast:contrast(style('.studio-brand strong').color,style('.studio-header').backgroundColor),galleryContrast:contrast(style('.gallery-heading h1').color,shell.backgroundColor),fonts:['Hanko Sans','Hanko Editorial'].map(font=>document.fonts.check('16px "'+font+'"')),themes};
  });
  assert.equal(colors.brand,colors.root,scheme+': header text belongs to the Studio palette');
  assert.equal(colors.heading,colors.root,scheme+': gallery text belongs to the Studio palette');
  assert.ok(colors.headerContrast>=4.5&&colors.galleryContrast>=4.5,scheme+': Studio text contrast');
  assert.deepEqual(colors.fonts,[true,true],'The authored fonts load under the production CSP');
  if(themeColors)assert.deepEqual(colors.themes,themeColors,'Changing Studio color scheme must not recolor theme previews or their input placeholders');
  themeColors=colors.themes;
  await page.screenshot({path:new URL('gallery-'+scheme+'.png',out).pathname,animations:'disabled'});
 }
 for(const [width,columns]of [[2000,4],[1440,3],[1000,2],[390,1]]){
  await page.setViewportSize({width,height:1200});
  assert.equal(await page.locator('.gallery-grid').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length),columns,width+'px: compact responsive cards');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,width+'px: no gallery overflow');
 }
 checks.push('Light/dark Studio colors have readable contrast; all sixteen previews keep their own palette, fonts and placeholders; gallery uses 4/3/2/1 columns.');
 await page.setViewportSize({width:2000,height:1400});
 for(const theme of catalogue.themes){
  await page.goto(new URL('?direction='+theme.id,server.url).href);
  const dialog=page.getByRole('dialog'),preview=dialog.locator('.theme-page');await preview.waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await preview.getAttribute('data-hanko-frame'),theme.id);
  await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))));
  const loginBefore=await snapshot(preview);
  await preview.screenshot({path:new URL(theme.id+'-login.png',out).pathname,animations:'disabled'});
  await dialog.getByRole('navigation',{name:'Template screens'}).getByRole('button',{name:'Profile',exact:true}).click();
  await dialog.locator('.kind-profile').waitFor();
  await preview.screenshot({path:new URL(theme.id+'-account.png',out).pathname,animations:'disabled'});
  const otherFamilies=new Map();
  for(const [key,label]of [['email:0','Courriels'],['admin:0','Administration'],['welcome:0','Accueil']]){
   await dialog.getByRole('navigation',{name:'Template screens'}).getByRole('button').nth(theme.templates.findIndex(template=>template.editorPage===key)).click();
   await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))));
   otherFamilies.set(label,await snapshot(preview));
  }
  await dialog.getByRole('navigation',{name:'Template screens'}).getByRole('button',{name:'Security',exact:true}).click();
  await dialog.locator('.kind-security').waitFor();
  const before=await snapshot(preview);
  await dialog.getByRole('button',{name:'Use this theme',exact:true}).click();
  await page.locator('.template-gallery').waitFor({state:'detached'});
  await page.getByRole('button',{name:'Tester le parcours',exact:true}).click();
  const canvas=page.locator('.canvas-area .theme-page');await canvas.locator('.kind-security').waitFor();
  const after=await snapshot(canvas);
  assert.deepEqual(after,before,theme.name+': exploration and editor have identical text, colors, fonts and slot geometry');
  await page.getByRole('combobox',{name:'Type de thème',exact:true}).click();await page.getByRole('option',{name:'Connexion',exact:true}).click();
  await canvas.locator('.kind-login').waitFor();
  await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))));
  assert.deepEqual(await snapshot(canvas),loginBefore,theme.name+': login and photographic framing also stay identical after applying the theme');
  for(const [label,expected]of otherFamilies){
   await page.getByRole('combobox',{name:'Type de thème',exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();
   await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))));
   assert.deepEqual(await snapshot(canvas),expected,theme.name+'/'+label+': the other families also keep the exact preview layout and copy');
  }
  const document=await exported(page);
  assert.equal(Object.keys(document.pages).length,18,theme.name+': selecting Security in Explore must still apply the whole theme');
  for(const template of theme.templates){
   const source=pageTemplates[template.path];
   assert.deepEqual(document.pages[template.editorPage],source,theme.id+'/'+template.editorPage+': applying/exporting keeps the exact authored document');
  }
  checks.push(theme.name+': same rendered exploration/editor frame; all 18 source documents survive application and JSON export.');
 }
 await page.setViewportSize({width:390,height:1000});
 for(const theme of catalogue.themes){
  await page.goto(new URL('?direction='+theme.id,server.url).href);const frame=page.getByRole('dialog').locator('.theme-page');await frame.waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await frame.evaluate(node=>node.scrollWidth<=node.clientWidth+1),true,theme.id+': mobile frame fits');
  await frame.screenshot({path:new URL(theme.id+'-mobile.png',out).pathname,animations:'disabled'});
 }
 checks.push('All sixteen actual theme previews fit a 390 px mobile viewport.');
 assert.deepEqual(errors,[],'No browser, font loading, or CSP errors');
 await writeFile(new URL('report.json',out),JSON.stringify({checks,errors},null,2)+'\n');
 console.log('Catalogue coherence passed: both URLs, sixteen identical exploration/editor frames, 288 unchanged exported pages and mobile previews.');
}finally{await browser.close();await server.close();}
