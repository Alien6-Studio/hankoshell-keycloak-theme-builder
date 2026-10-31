import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTheme,mergeTheme,themeVariables,createThemeLoader} from '../dist/index.js';
const base={version:1,name:'example',headline:'Example'};
test('appearance accepts modern colors and independent light/dark palettes',()=>{
 const config=parseTheme({...base,colors:{dark:{primary:'oklch(0.7 0.1 200)',primaryForeground:'#001122'},light:{primary:'#2563eb'}},layout:{cardRadius:'1rem'}});
 assert.equal(themeVariables(config,'dark')['--primary-fg'],'#001122');assert.equal(themeVariables(config,'light')['--primary'],'#2563eb');
});
test('untrusted JSON cannot inject CSS, URLs, credentials or unknown properties',()=>{
 for(const input of [{...base,fontFamily:'Arial; background:url(https://example.test)'},{...base,logoUrl:'javascript:alert(1)'},{...base,logoUrl:'https://user:secret@example.test/logo.svg'},{...base,colors:{dark:{primary:'#12345'}}},{...base,colors:{dark:{primary:'red; color: blue'}}},{...base,runtime:{endpoint:'//example.test/theme'}},{...base,runtime:{endpoint:'https://example.test/theme'}},{...base,script:'alert(1)'},JSON.parse('{"version":1,"name":"x","__proto__":{"polluted":true}}')])assert.throws(()=>parseTheme(input));
 assert.equal({}.polluted,undefined);
 assert.throws(()=>parseTheme({...base,logoUrl:'/\\example.test/logo.svg'}));
 assert.throws(()=>createThemeLoader({endpoint:'/\\example.test/theme'}));
});
test('merging updates only appearance and retains untouched mode settings',()=>{
 const config=parseTheme({...base,colors:{dark:{background:'#010203',primary:'#abc'},light:{primary:'#fff'}},runtime:{endpoint:'/appearance'}});
 const next=mergeTheme(config,{colors:{dark:{primary:'#123'}}});
 assert.equal(next.colors.dark.background,'#010203');assert.equal(next.colors.light.primary,'#fff');assert.equal(config.colors.dark.primary,'#abc');
 assert.throws(()=>mergeTheme(config,{runtime:{endpoint:'/elsewhere'}}));
});
test('runtime fetch is anonymous, bounded, same origin and preserves identity',async()=>{
 let request;
 const load=createThemeLoader({endpoint:'/themes/{realm}/{clientId}.json'},async(url,options)=>{request={url,options};return new Response(JSON.stringify({...base,name:'other',headline:'Published',runtime:{endpoint:'/ignored'}}));});
 const signal=new AbortController().signal;const patch=await load({realm:'space/tenant',clientId:'app?query',signal});
 assert.equal(request.url,'/themes/space%2Ftenant/app%3Fquery.json');assert.equal(request.options.credentials,'omit');assert.equal(request.options.redirect,'error');assert.equal(request.options.signal,signal);assert.deepEqual(patch,{headline:'Published'});
});
test('runtime rejects failed, oversized and invalid publications',async()=>{
 for(const response of [new Response('',{status:503}),new Response('x'.repeat(800000)),new Response(JSON.stringify({...base,colors:{dark:{primary:'url(/track)'}}}))]){
  const load=createThemeLoader({endpoint:'/theme'},async()=>response);await assert.rejects(()=>load({realm:'x',signal:new AbortController().signal}));
 }
});
