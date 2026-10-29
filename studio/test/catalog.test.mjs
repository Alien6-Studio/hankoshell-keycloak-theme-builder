import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),contracts=require('../dist/contracts.cjs');
const root=new URL('../catalog/',import.meta.url);
const json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const catalogue=await json('themes.json');
test('complete themes contain every guided screen and valid portable documents',async()=>{
 assert.deepEqual(contracts.validate('catalog',catalogue),{valid:true,errors:[]});
 const complete=catalogue.themes.filter(theme=>theme.complete);assert.equal(complete.length,3);
 for(const theme of complete){
  assert.equal(theme.templates.length,18);const pages={};
  for(const template of theme.templates){const page=await json(template.path);assert.deepEqual(contracts.validate('page',page),{valid:true,errors:[]},template.path);pages[template.editorPage]=page;assert.equal(page.i18n.supportedLocales.length,8);}
  assert.deepEqual(contracts.validate('project',{format:'hanko.theme-studio.project/v1',name:theme.id,pages,media:[],destination:{mode:'hanko',url:'',realm:'demo',scope:'realm',client:'',theme:theme.id},publication:{status:'draft',built:false,deployed:false,attached:false}}),{valid:true,errors:[]});
  assert.notEqual(pages['email:0'].subject,pages['email:1'].subject);assert.notEqual(pages['email:1'].subject,pages['email:2'].subject);
  for(const asset of theme.assets){assert.equal(asset.license,'Apache-2.0');const bytes=await readFile(new URL(asset.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
 }
 assert.equal(catalogue.sections.length,4);
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
