import {catalogue,pageTemplates as templates} from '@alien6/hankoshell-theme-catalog';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),contracts=require('../dist/contracts.cjs');
const bundled=await build({entryPoints:[fileURLToPath(new URL('../src/catalog-theme.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const {materializeThemePages}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));

test('the installed catalogue materializes valid Studio projects with the builder contracts',async()=>{
 assert.deepEqual(contracts.validate('catalog',catalogue),{valid:true,errors:[]});
 for(const theme of catalogue.themes){
  const pages=materializeThemePages(theme,templates);
  assert.equal(Object.keys(pages).length,18);
  assert.deepEqual(contracts.validate('project',{format:'hanko.theme-studio.project/v1',name:theme.id,pages,media:[],destination:{mode:'hanko',url:'',realm:'demo',scope:'realm',client:'',theme:theme.id},publication:{status:'draft',built:false,deployed:false,attached:false}}),{valid:true,errors:[]});
 }
});
test('applying a theme returns exactly the authored documents and never mutates the catalogue',()=>{
 const snapshot=JSON.stringify(templates);
 for(const theme of catalogue.themes){
  const pages=materializeThemePages(theme,templates);
  for(const template of theme.templates)assert.deepEqual(pages[template.editorPage],templates[template.path],theme.id+'/'+template.editorPage);
  pages['login:0'].blocks[0].text='Custom title';pages['login:0'].native.copy.title='Custom form';
  assert.equal(JSON.stringify(templates),snapshot);
  assert.notEqual(materializeThemePages(theme,templates)['login:0'].blocks[0].text,'Custom title');
 }
});

test('projects reject unsafe media, duplicate block IDs and dangling translations',async()=>{
 const page=JSON.parse(await readFile(new URL('../../test/fixtures/legacy-login.json',import.meta.url),'utf8'));
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
