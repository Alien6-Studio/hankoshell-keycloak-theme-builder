import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {staticServer} from '../test/static-server.mjs';
const {chromium}=createRequire(new URL('../../package.json',import.meta.url))('playwright');
const destination=new URL('../docs/screenshots/',import.meta.url);await mkdir(destination,{recursive:true});
const server=await staticServer(fileURLToPath(new URL('../site/',import.meta.url)));
let browser;
try{
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1});
 await page.goto(server.url);await page.locator('.gallery-card').first().waitFor();
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
 await page.setViewportSize({width:1600,height:1550});
 await page.screenshot({path:fileURLToPath(new URL('gallery.png',destination)),animations:'disabled'});
 await page.setViewportSize({width:1600,height:1100});
 await page.getByRole('checkbox',{name:'Conserver ma marque',exact:true}).uncheck();
 await page.getByRole('checkbox',{name:'Conserver les contenus des écrans existants',exact:true}).uncheck();
 await page.locator('.gallery-card').filter({has:page.getByRole('heading',{name:'Editorial',exact:true})}).getByRole('button',{name:'Utiliser ce thème'}).click();
 await page.locator('.template-gallery').waitFor({state:'detached'});
 await page.getByRole('textbox',{name:'Modifier titre du bloc',exact:true}).click();
 await page.getByRole('tab',{name:'Style',exact:true}).click();
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
 await page.screenshot({path:fileURLToPath(new URL('editor.png',destination)),animations:'disabled'});
 console.log('Saved README gallery and live-editor screenshots from the standalone build.');
}finally{await browser?.close();await server.close();}
