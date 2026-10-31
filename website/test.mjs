import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {catalogue} from '@alien6/hankoshell-theme-catalog';

const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'..'),site=resolve(directory,'dist');
const {chromium}=createRequire(resolve(root,'package.json'))('playwright');
const {AxeBuilder}=createRequire(resolve(root,'studio/package.json'))('@axe-core/playwright');
const output=resolve(root,'.theme-kit/website-qualification');await mkdir(output,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(site,'.'+path+(path.endsWith('/')?'index.html':''));if(!file.startsWith(site+sep))throw Error('Invalid path');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
let browser;
try{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto(base);await page.getByRole('heading',{level:1,name:'Your Keycloak. Your design.'}).waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.theme-card').count(),16);
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://studio.hanko.sh/');
 const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());assert.ok(schema['@graph'].some(item=>item['@type']==='WebApplication'));assert.ok(schema['@graph'].some(item=>item['@type']==='FAQPage'));
 for(const theme of ['maison','precision','parade','zeste']){
  await page.locator('[data-hero-theme="'+theme+'"]').click();
  for(const screen of ['login','account','security']){await page.locator('[data-screen="'+screen+'"]').click();assert.match(await page.locator('#hero-preview').getAttribute('src'),new RegExp(theme+'-'+screen+'\\.webp$'));await page.locator('#hero-preview').evaluate(image=>image.decode());}
 }
 await page.getByRole('button',{name:'Vibrant 4',exact:true}).click();assert.equal(await page.locator('.theme-card:visible').count(),4);assert.equal(await page.locator('#theme-count').textContent(),'4 themes');
 await page.getByRole('button',{name:'All directions 16',exact:true}).click();assert.equal(await page.locator('.theme-card:visible').count(),16);
 await page.setViewportSize({width:1600,height:1100});await page.screenshot({path:resolve(output,'desktop.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Desktop has no horizontal overflow');
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>node.target)})),[]);
 const sitemap=await (await page.request.get(base+'sitemap.xml')).text();assert.equal((sitemap.match(/<loc>/g)||[]).length,17);
 for(const theme of catalogue.themes){
  const slug=theme.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');await page.goto(base+'themes/'+slug+'/');
  await page.getByRole('heading',{level:1,name:theme.name,exact:true}).waitFor();assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://studio.hanko.sh/themes/'+slug+'/');
  assert.ok((await page.locator('meta[name=description]').getAttribute('content')).includes(theme.description));
  const data=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());assert.ok(data['@graph'].some(item=>item['@type']==='BreadcrumbList'));assert.equal(data['@graph'].some(item=>item['@type']==='FAQPage'),false);
  for(const image of await page.locator('.detail-image img,.detail-screens img').all())await image.evaluate(image=>image.decode());
 }
 await page.goto(base);await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Menu',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Menu',exact:true}).getAttribute('aria-expanded'),'true');await page.locator('.site-nav').getByRole('link',{name:'Collection',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Menu',exact:true}).getAttribute('aria-expanded'),'false');
 await page.screenshot({path:resolve(output,'mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile has no horizontal overflow');
 await page.emulateMedia({colorScheme:'light'});await page.goto(base+'app/?direction=maison&locale=en');await page.getByRole('dialog').getByRole('heading',{name:'Haven',exact:true}).waitFor();await page.getByRole('dialog').locator('.theme-page[lang=en]').waitFor();
 assert.equal(await page.locator('.hanko-theme-studio').getAttribute('data-theme'),'light','The demo defaults to the light HankoShell appearance');
 await page.getByText('For any Keycloak project. Edit and export here; compile locally with the CLI.',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Construire et installer',exact:true}).count(),0,'No remote build action in the public demo');
 const noindex=await page.locator('meta[name=robots]').getAttribute('content');assert.equal(noindex,'noindex,follow');
 await page.setViewportSize({width:1600,height:1100});await page.goto(base+'?scheme=dark');
 const darkAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();assert.deepEqual(darkAudit.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)})),[]);await page.screenshot({path:resolve(output,'desktop-dark.png'),fullPage:true});
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('light');
 await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'light','Appearance persists through reload');
 await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
 await page.locator('.hero-actions .button-primary').click();
 await page.locator('.hanko-theme-studio[data-theme=dark]').waitFor();await page.waitForFunction(()=>{const image=document.querySelector('img.brand-mark');return image?.complete&&image.naturalWidth>0;});
 assert.equal(new URL(page.url()).searchParams.get('scheme'),'dark','The site carries appearance into the demo');
 await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('system');
 await page.emulateMedia({colorScheme:'light'});await page.locator('.hanko-theme-studio[data-theme=light]').waitFor();
 await page.emulateMedia({colorScheme:'dark'});await page.locator('.hanko-theme-studio[data-theme=dark]').waitFor();await page.waitForFunction(()=>{const image=document.querySelector('img.brand-mark');return image?.complete&&image.naturalWidth>0;});
 await page.goto(base+'app/?view=editor&locale=en&scheme=light');
 await page.getByRole('button',{name:'Exporter / compiler localement',exact:true}).waitFor();
 await page.locator('.flow-step').filter({hasText:'Construire'}).click();
 await page.getByText('La démo fonctionne dans votre navigateur : elle ne lance ni Keycloakify, ni compilation, ni connexion à Keycloak. Exportez votre projet, puis construisez le JAR localement avec le CLI.',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Construire et installer',exact:true}).count(),0);
 await page.getByRole('region',{name:'Publication du projet'}).getByRole('button',{name:'Exporter le projet',exact:true}).waitFor();
 const limited=await browser.newContext();await limited.addInitScript(()=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(key){if(key==='hankoshell-studio-appearance')throw new DOMException('Preference unavailable','SecurityError');return get.call(this,key)};Storage.prototype.setItem=function(key,value){if(key==='hankoshell-studio-appearance')throw new DOMException('Preference unavailable','SecurityError');return set.call(this,key,value)}});const limitedPage=await limited.newPage();limitedPage.on('pageerror',error=>errors.push(error.message));await limitedPage.goto(base);await limitedPage.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');assert.equal(await limitedPage.locator('html').getAttribute('data-theme'),'dark');await limitedPage.goto(base+'app/?scheme=dark&locale=en');await limitedPage.locator('.hanko-theme-studio[data-theme=dark]').waitFor();await limited.close();
 assert.deepEqual(errors,[],'No runtime, asset loading or CSP errors');
 console.log('Public site passed: 16 real themes, hero controls, filters, 17 canonical pages, structured data, mobile navigation, accessibility and the actual Studio.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
