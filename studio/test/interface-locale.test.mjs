import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/interface-locale';export * from './src/interface-messages';",resolveDir:new URL('..',import.meta.url).pathname},bundle:true,platform:'node',format:'esm',write:false});
const{parseInterfaceLocale,readInterfaceLocale,interfaceTranslator,uiMessage,interfaceMessages,interfaceLocaleStorageKey}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('UI locale accepts supported BCP47 tags and rejects unsupported or hostile values',()=>{for(const value of ['fr-FR','fr-CA','FR'])assert.equal(parseInterfaceLocale(value),'fr');assert.equal(parseInterfaceLocale('en-US'),'en');for(const value of ['ar','de','<img src=x>','fr/../../en','',null,{}])assert.equal(parseInterfaceLocale(value),undefined);});
test('explicit UI handoff wins over saved preference and browser language independently of theme content',()=>{
 const previous={location:Object.getOwnPropertyDescriptor(globalThis,'location'),localStorage:Object.getOwnPropertyDescriptor(globalThis,'localStorage'),navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
 try{let saved='en';Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?locale=ar&uiLocale=fr-CA'}});Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>{assert.equal(key,interfaceLocaleStorageKey);return saved;}}});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{languages:['de-DE','fr-FR']}});
 assert.equal(readInterfaceLocale(),'fr');location.search='?locale=ar&uiLocale=evil';assert.equal(readInterfaceLocale(),'en');saved='unsupported';assert.equal(readInterfaceLocale(),'fr');Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('blocked')}});navigator.languages=['de-DE'];assert.equal(readInterfaceLocale(),'en');
 }finally{for(const[key,descriptor]of Object.entries(previous))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
});
test('language changes reformat persistent notices without translating user-supplied parameters',()=>{
 const message=uiMessage('{block} added to {zone}.',{block:uiMessage('Titre'),zone:uiMessage('Zone latérale')});assert.equal(interfaceTranslator('en')(message),'Heading added to Side panel.');assert.equal(interfaceTranslator('fr')(message),'Titre ajouté dans Zone latérale.');
 const name='<img src=x onerror=alert(1)> {count} Compte';for(const locale of ['en','fr'])assert.ok(interfaceTranslator(locale)(uiMessage('Add {name}',{name})).endsWith(name));
 assert.equal(interfaceTranslator('en')('Contrats JSON'),'JSON contracts');assert.equal(interfaceTranslator('fr')('JSON contracts'),'Contrats JSON');assert.equal(interfaceTranslator('en')('  Propriétés '),'  Properties ');
});
test('every translated interface message retains the same interpolation variables',()=>{
 const parameters=text=>[...text.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
 for(const[en,fr]of interfaceMessages)assert.deepEqual(parameters(fr),parameters(en),en);
});
