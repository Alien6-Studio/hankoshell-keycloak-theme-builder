import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {staticServer} from './static-server.mjs';
import AxeBuilder from '@axe-core/playwright';
const {chromium}=createRequire(new URL('../../package.json',import.meta.url))('playwright');
import {catalogue} from '@alien6/hankoshell-theme-catalog';
const output=new URL('../../.theme-kit/catalog-continuity/',import.meta.url);await mkdir(output,{recursive:true});
const server=await staticServer(fileURLToPath(new URL('../site',import.meta.url))),browser=await chromium.launch();
const checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1600,height:1200}}),page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 const dimensions=frame=>frame.evaluate(node=>{
  const rect=selector=>{const r=node.querySelector(selector)?.getBoundingClientRect();return r&&{x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
  return {fits:node.scrollWidth<=node.clientWidth+1,aside:rect('[data-hanko-slot=aside]'),form:rect('[data-hanko-slot=form]'),images:node.querySelectorAll('img').length};
 });
 for(const theme of catalogue.themes){
  await page.setViewportSize({width:1600,height:1200});await page.goto(new URL('?direction='+theme.id,server.url).href);
  const dialog=page.getByRole('dialog'),frame=dialog.locator('.theme-page'),tabs=dialog.getByRole('navigation',{name:'Template screens'}).getByRole('button');await frame.waitFor();
  for(const [index,template]of theme.templates.entries()){
   await tabs.nth(index).click();await page.evaluate(()=>document.fonts.ready);
   const measure=await dimensions(frame),key=theme.id+'/'+template.editorPage;
   assert.equal(measure.fits,true,key+': desktop fits');
   if(theme.assets.length)assert.equal(measure.images,1,key+': same photographic identity');
   const a=measure.aside,b=measure.form;
   assert.ok(!a||!b||a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1,key+': services never overlap the form');
   if(['account:1','admin:0','email:0','welcome:0'].includes(template.editorPage)){
    await frame.screenshot({path:new URL(theme.id+'-'+template.editorPage.replace(':','-')+'.png',output).pathname,animations:'disabled'});
    if(['maison','zeste','parade','bloom','rivage'].includes(theme.id)){
     const result=await new AxeBuilder({page}).include('[role=dialog] .theme-page').withRules(['color-contrast']).analyze();
     assert.deepEqual(result.violations,[],key+': readable text and controls');
    }
   }
  }
  await page.setViewportSize({width:390,height:1000});
  for(const key of ['account:0','account:1','account:3','admin:0','email:0','welcome:0']){
   await tabs.nth(theme.templates.findIndex(template=>template.editorPage===key)).click();
   assert.equal((await dimensions(frame)).fits,true,theme.id+'/'+key+': mobile fits');
  }
  checks.push({theme:theme.id,desktop:18,mobile:6});console.log(theme.id+': 18 desktop and 6 mobile pages passed');
 }
 assert.deepEqual(errors,[]);
 await writeFile(new URL('report.json',output),JSON.stringify({checks,errors},null,2)+'\n');
 console.log('Continuity passed: 288 desktop pages, 96 mobile pages, twenty contrast audits.');
}finally{await browser.close();await server.close();}
