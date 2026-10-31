import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';
import * as browser from '../src/generated/browser-contracts.js';
const require=createRequire(import.meta.url),server=require('../dist/contracts.cjs');
test('precompiled browser and server validators agree on data and untrusted declarations',async()=>{
 const page=JSON.parse(await readFile(new URL('../../test/fixtures/legacy-login.json',import.meta.url),'utf8'));
 const plugin=JSON.parse(await readFile(new URL('../contracts/plugin-example.json',import.meta.url),'utf8'));
 const project={format:'hanko.theme-studio.project/v1',name:'demo',pages:{'login:0':page}};
 const cases=[['page',page,true],['project',project,true],['plugin',plugin,true],['project',{...project,publication:{status:'draft',built:true,deployed:false,attached:false}},false],['page',{...page,blocks:[...page.blocks,page.blocks[0]]},false],['page',{...page,blocks:[{type:'button',zone:'aside',href:'javascript:alert(1)'}]},false],['project',JSON.parse('{"__proto__":{}}'),false]];
 for(const[kind,document,expected]of cases){assert.equal(server.validate(kind,document).valid,expected,kind);assert.equal(browser.validate(kind,document).valid,expected,kind);}
 const bad=structuredClone(plugin);bad.blocks[0].propsSchema={$ref:'https://untrusted.test/schema'};assert.equal(server.validate('plugin',bad).valid,false);assert.equal(browser.validate('plugin',bad).valid,false);
 const malformed=structuredClone(plugin);malformed.blocks[0].propsSchema={type:123};assert.equal(server.validate('plugin',malformed).valid,false);assert.equal(browser.validate('plugin',malformed).valid,false);
 assert.equal(browser.bundle('page').$id,server.bundle('page').$id);
});
