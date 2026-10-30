import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {createServer} from 'node:net';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {chromium} from 'playwright';
import {authenticationPages} from '../dist/pages.js';import {projectFixture} from './project-fixture.mjs';
const directory=await mkdtemp(join(tmpdir(),'studio-native-')),file=join(directory,'project.json');await writeFile(file,JSON.stringify(await projectFixture()));
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin='http://127.0.0.1:'+port,server=spawn(process.execPath,[resolve('dist/cli.js'),'dev-project',file,'--port',String(port)],{stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',chunk=>log+=chunk);server.stderr.on('data',chunk=>log+=chunk);let browser;
try{
 for(let attempt=0;;attempt++){try{if((await fetch(origin,{signal:AbortSignal.timeout(1000)})).ok)break;}catch{}if(attempt===60||server.exitCode!==null)throw Error('Project preview unavailable: '+log.slice(-2000));await new Promise(resolve=>setTimeout(resolve,200));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);
 for(const language of ['fr','en','he']){
  await page.getByLabel('Language',{exact:true}).selectOption(language);
  for(const id of authenticationPages){await page.getByLabel('Page',{exact:true}).selectOption(id);const view=page.locator('[data-preview-page="'+id+'"] .hkc-root[lang="'+language+'"]');await view.waitFor();assert.equal(await view.getAttribute('lang'),language);assert.equal(await view.getAttribute('dir'),language==='he'?'rtl':'ltr');}
 }
 await page.getByLabel('Page',{exact:true}).selectOption('register.ftl');await page.getByLabel('Language',{exact:true}).selectOption('fr');await page.locator('.hkc-form label').filter({hasText:'Votre adresse de contact'}).waitFor();
 await page.getByLabel('Page',{exact:true}).selectOption('login-username.ftl');await page.getByLabel('Language',{exact:true}).selectOption('fr');await page.getByRole('button',{name:'Entrer dans mon espace',exact:true}).waitFor();
 assert.notEqual(await page.locator('.hkc-form p a.hk-link').textContent(),'Entrer dans mon espace','The registration link retains its native action');
 assert.equal(await page.locator('.hkc-form form').first().getAttribute('method'),'post');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.hkc-root').evaluate(node=>node.scrollWidth<=node.clientWidth),true,'Composed native login fits a narrow viewport');
 assert.deepEqual(errors,[]);console.log('Composed native previews passed: 22 pages, French/English/Hebrew, RTL, native action links and mobile layout.');
}finally{await browser?.close();server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));await rm(directory,{recursive:true,force:true});}
