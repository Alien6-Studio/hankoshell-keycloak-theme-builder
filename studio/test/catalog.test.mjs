import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),contracts=require('../dist/contracts.cjs');
const root=new URL('../catalog/',import.meta.url);
const json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const catalogue=await json('themes.json');
const bundled=await build({entryPoints:[fileURLToPath(new URL('../src/catalog-theme.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const {materializeThemePages}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const templates=Object.fromEntries(await Promise.all([...new Set(catalogue.themes.flatMap(theme=>theme.templates.map(template=>template.path)))].map(async path=>[path,await json(path)])));
test('complete themes contain every guided screen and valid portable documents',async()=>{
 assert.deepEqual(contracts.validate('catalog',catalogue),{valid:true,errors:[]});
 const complete=catalogue.themes.filter(theme=>theme.complete);assert.equal(complete.length,23);
 assert.equal(new Set(catalogue.themes.map(theme=>theme.id)).size,catalogue.themes.length);
 for(const theme of complete){
  assert.equal(theme.templates.length,18);const pages=materializeThemePages(theme,templates);
  assert.equal(Object.keys(pages).length,18);
  assert.deepEqual(contracts.validate('theme',await json(theme.themePath)),{valid:true,errors:[]},theme.themePath);
  for(const page of Object.values(pages)){assert.deepEqual(contracts.validate('page',page),{valid:true,errors:[]},theme.id);assert.equal(page.i18n.supportedLocales.length,8);}
  assert.deepEqual(contracts.validate('project',{format:'hanko.theme-studio.project/v1',name:theme.id,pages,media:[],destination:{mode:'hanko',url:'',realm:'demo',scope:'realm',client:'',theme:theme.id},publication:{status:'draft',built:false,deployed:false,attached:false}}),{valid:true,errors:[]});
  assert.notEqual(pages['email:0'].subject,pages['email:1'].subject);assert.notEqual(pages['email:1'].subject,pages['email:2'].subject);
  for(const asset of theme.assets){assert.equal(asset.license,'Apache-2.0');const bytes=await readFile(new URL(asset.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
 }
 assert.equal(catalogue.sections.length,4);
});
test('market-inspired themes materialize distinct styles without changing shared pages',async()=>{
 const expected=['microsoft-entra','google-workspace','github','gitlab','okta','auth0','aws-console','salesforce','atlassian','slack','notion','linear','stripe','shopify','vercel','dropbox','hubspot','zoom','datadog','cloudflare'];
 const snapshot=JSON.stringify(templates);
 for(const id of expected){
  const theme=catalogue.themes.find(theme=>theme.id===id);assert.ok(theme?.complete,id);
  const base=catalogue.themes.find(entry=>entry.id===theme.baseTheme);assert.ok(base?.complete);assert.equal(base.baseTheme,undefined,'Only a concrete base may be shared');
  const pages=materializeThemePages(theme,templates);
  for(const [key,page] of Object.entries(pages)){
   assert.equal(page.preset,id);assert.equal(page.layout,theme.style.layout);assert.equal(page.accent,theme.style.accent);
   assert.equal(page.appearance.font,theme.style.font);assert.equal(page.appearance.background,theme.style.background);
   assert.deepEqual(page.i18n,templates[theme.templates.find(template=>template.editorPage===key).path].i18n);
   const native=await json(theme.themePath);assert.equal(page.native.buttonColor,native.colors.light.primaryForeground);
  }
  pages['login:0'].blocks[0].text='Custom title';pages['login:0'].native.copy.title='Custom form';
  assert.equal(JSON.stringify(templates),snapshot,'Applying or editing a theme must not mutate library documents');
  assert.notEqual(materializeThemePages(theme,templates)['login:0'].blocks[0].text,'Custom title');
 }
 assert.equal(new Set(expected.map(id=>catalogue.themes.find(theme=>theme.id===id).style.layout)).size,3);
});
function luminance(hex){const [r,g,b]=hex.slice(1).match(/../g).map(value=>{const c=parseInt(value,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('complete catalogue palettes keep readable body, secondary and action text',()=>{
 for(const theme of catalogue.themes.filter(theme=>theme.complete)){
  const page=materializeThemePages(theme,templates)['login:0'];
  for(const background of [page.appearance.background,page.appearance.surface]){
   assert.ok(contrast(page.appearance.foreground,background)>=4.5,theme.id+' body text');
   assert.ok(contrast(page.appearance.muted,background)>=4.5,theme.id+' secondary text');
  }
  assert.ok(contrast(page.native.buttonColor,page.native.buttonBackground)>=4.5,theme.id+' action text');
 }
});
test('projects reject unsafe media, duplicate block IDs and dangling translations',async()=>{
 const page=await json('themes/essential/pages/login.json');
 page.blocks[1].src='https://untrusted.test/pixel.png';assert.equal(contracts.validate('page',page).valid,false);
 delete page.blocks[1].src;page.blocks.push(structuredClone(page.blocks[0]));
 assert.equal(contracts.validate('project',{format:'hanko.theme-studio.project/v1',name:'demo',pages:{'login:0':page}}).valid,false);
 page.blocks.pop();page.i18n.messages.en['blocks.missing.text']='Missing';assert.equal(contracts.validate('page',page).valid,false);
});
test('native contracts accept local absolute paths and reject protocol relative paths',()=>{
 const theme={version:1,name:'demo',logoUrl:'/logo.png'};
 assert.equal(contracts.validate('theme',theme).valid,true);
 assert.equal(contracts.validate('theme',{...theme,logoUrl:'//attacker.test/logo.png'}).valid,false);
});
