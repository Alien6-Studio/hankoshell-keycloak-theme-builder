import {createRequire} from 'node:module';
import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'../package.json'));const{chromium}=require('playwright');
const catalogue=JSON.parse(await readFile(resolve(root,'catalog/themes.json'),'utf8'));
const browser=await chromium.launch({headless:true});
try{for(const theme of catalogue.themes.filter(theme=>theme.complete)){
 const page=await browser.newPage({viewport:{width:1320,height:1100},deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:7425/?preview=${theme.id}`);await page.locator('.theme-page img').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.locator('.theme-page').screenshot({path:resolve(root,`catalog/themes/${theme.id}/preview.png`)});
 const png=await readFile(resolve(root,`catalog/themes/${theme.id}/preview.png`));theme.preview='data:image/png;base64,'+png.toString('base64');await page.close();
}}finally{await browser.close();}
await writeFile(resolve(root,'catalog/themes.json'),JSON.stringify(catalogue,null,2)+'\n');
const target=resolve(root,'../../hankoshell-theme-catalog/catalog');await mkdir(target,{recursive:true});await cp(resolve(root,'catalog'),target,{recursive:true});
console.log('Captured the three rendered templates for the catalogue.');
