import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {catalogue} from '@alien6/hankoshell-theme-catalog';
import {frameCss} from '@alien6/hankoshell-theme-catalog/frames';
import {staticServer} from '../studio/test/static-server.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'website/assets/themes'),temporary=resolve(root,'.theme-kit/website-capture');
const {chromium}=createRequire(resolve(root,'package.json'))('playwright');
const source=JSON.parse(await readFile(resolve(root,'vendor/theme-catalog-source.json'),'utf8'));
await mkdir(output,{recursive:true});await mkdir(temporary,{recursive:true});
const server=await staticServer(resolve(root,'studio/site'));let browser;
const socialOnly=process.argv.includes('--social-only');
const records=socialOnly?JSON.parse(await readFile(resolve(output,'manifest.json'),'utf8')).images:[];
try{
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1120,height:1000},deviceScaleFactor:1});
 for(const theme of socialOnly?[]:catalogue.themes)for(const [screen,key]of [['login','login:0'],['account','account:0'],['security','account:1']]){
  await page.goto(server.url+'?preview='+theme.id+'&screen='+encodeURIComponent(key)+'&locale=en');
  const frame=page.locator('.theme-page[lang=en]');await frame.waitFor();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
  const jpeg=resolve(temporary,theme.id+'-'+screen+'.jpg'),name=theme.id+'-'+screen+'.webp';
  await frame.screenshot({path:jpeg,type:'jpeg',quality:95,animations:'disabled'});
  execFileSync('cwebp',['-quiet','-q','84',jpeg,'-o',resolve(output,name)]);
  const bounds=await frame.boundingBox(),bytes=await readFile(resolve(output,name));
  records.push({file:name,width:Math.round(bounds.width),height:Math.round(bounds.height),sha256:createHash('sha256').update(bytes).digest('hex')});
  if(screen==='login'){
   const thumb=theme.id+'-thumb.webp';execFileSync('cwebp',['-quiet','-q','82','-resize','560','0',jpeg,'-o',resolve(output,thumb)]);
   const data=await readFile(resolve(output,thumb));records.push({file:thumb,width:560,height:Math.round(bounds.height*560/bounds.width),sha256:createHash('sha256').update(data).digest('hex')});
  }
 }
 const fontFaces=[...frameCss.matchAll(/@font-face\s*\{[^}]*\}/g)].map(match=>match[0]).join('\n');
 const image=(id)=>'data:image/webp;base64,'+readFileSync(resolve(output,id+'-login.webp')).toString('base64');
 await page.setViewportSize({width:1200,height:630});
 await page.setContent(`<!doctype html><html lang="en"><style>${fontFaces}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#181d1f;color:#f4f5ef;font-family:'Hanko Sans',sans-serif;overflow:hidden}.brand{position:absolute;left:60px;top:43px;font-size:22px;font-weight:700;letter-spacing:-1px}.mark{display:inline-block;background:#c7184b;color:#fff;padding:0 7px;border-radius:5px;margin-right:10px}h1{position:absolute;top:139px;left:60px;font-size:91px;line-height:1.05;letter-spacing:-7px;margin:0;font-weight:650;z-index:2}em{font-family:'Hanko Editorial',serif;color:#ff7897;font-weight:400;letter-spacing:-5px}.sub{position:absolute;left:63px;bottom:61px;color:#acb5b9;font-size:17px;letter-spacing:1px}.screen{position:absolute;left:692px;top:113px;width:590px;padding:10px;background:#24292c;border:1px solid #4b5155;border-radius:10px;transform:rotate(3deg);box-shadow:0 30px 80px #0008}.screen img{width:100%;border-radius:4px;display:block}.mini{left:834px;top:384px;width:300px;transform:rotate(-5deg)}.url{position:absolute;right:58px;top:48px;color:#acb5b9;font-size:15px}</style><div class="brand"><span class="mark">H</span>Hanko Studio</div><div class="url">studio.hanko.sh</div><h1>Keycloakify,<br><em>supercharged.</em></h1><p class="sub">16 DESIGNS / 18 SCREENS / 8 LANGUAGES</p><div class="screen"><img alt="Zest theme" src="${image('zeste')}"></div><div class="screen mini"><img alt="Haven theme" src="${image('maison')}"></div></html>`);
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
 await page.screenshot({path:resolve(root,'website/assets/social.jpg'),type:'jpeg',quality:92});
 await writeFile(resolve(output,'manifest.json'),JSON.stringify({catalogueContentSha256:source.contentSha256,locale:'en',screens:['login','account','security'],images:records},null,2)+'\n');
 console.log('Captured 48 real English theme screens, 16 thumbnails and the social image.');
}finally{await browser?.close();await server.close();await rm(temporary,{recursive:true,force:true});}
