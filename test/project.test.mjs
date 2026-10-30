import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {parseStudioProject} from '../dist/studio-project.js';import {writeEmailTheme} from '../dist/email-theme.js';import {compositionI18n,compositionPage} from '../dist/composition-model.js';
const login=JSON.parse(await readFile(new URL('../studio/catalog/themes/essential/pages/login.json',import.meta.url),'utf8'));
const email=JSON.parse(await readFile(new URL('../studio/catalog/themes/essential/pages/email-verification.json',import.meta.url),'utf8'));
function fixture(){return{format:'hanko.theme-studio.project/v1',name:'test',pages:{'login:0':structuredClone(login),'email:0':structuredClone(email)}};}
test('project compilation validates the portable contract and rejects uninstalled renderers',()=>{
 assert.equal(parseStudioProject(fixture()).name,'test');
 for(const change of [p=>p.pages['login:0'].blocks.push({id:'unsafe',type:'button',zone:'aside',href:'javascript:alert(1)'}),p=>p.pages['application:custom']={blocks:[]},p=>p.plugins=[{id:'custom'}],p=>delete p.pages['login:0'],p=>delete p.pages['login:0'].appearance]){
  const project=fixture();change(project);assert.throws(()=>parseStudioProject(project));
 }
});
test('localized composition preserves native navigation and error copy',()=>{
 const project=fixture();project.pages['login:0'].native.copy.action='Entrer';project.pages['login:0'].i18n.messages.en['native.action']='Enter';
 const native={currentLanguage:{languageTag:'fr'},msgStr:key=>'native:'+key,msg:key=>'native:'+key,advancedMsgStr:key=>'native:'+key,advancedMsg:key=>'native:'+key};
 const translated=compositionI18n(native,'login.ftl',project);
 assert.equal(translated.msgStr('doLogIn'),'Entrer');assert.equal(translated.msgStr('doRegister'),'native:doRegister');
 assert.equal(translated.advancedMsgStr('${username}'),project.pages['login:0'].native.copy.usernameLabel);
 assert.equal(translated.advancedMsgStr('before ${username}'),'native:before ${username}');
 assert.equal(translated.msgStr('invalidPasswordMessage'),'native:invalidPasswordMessage');
 assert.equal(compositionI18n(native,'error.ftl',project),native);
 assert.equal(compositionPage(project,'login.ftl','en').native.copy.action,'Enter');
});
test('email templates keep authored FreeMarker and HTML inert while retaining native action links',async()=>{
 const project=fixture(),directory=await mkdtemp(join(tmpdir(),'studio-mail-'));
 project.pages['email:0'].blocks[0].text='<#assign p="bad">${7*7}<script>alert(1)</script> {{prénom}} {{organisation}}';
 try{
  await writeEmailTheme(project,directory);
  const html=await readFile(join(directory,'html/email-verification.ftl'),'utf8'),plain=await readFile(join(directory,'text/email-verification.ftl'),'utf8'),messages=await readFile(join(directory,'messages/messages.properties'),'utf8');
  assert.doesNotMatch(html,/<#assign p|<script>alert|\$\{7\*7\}/);assert.match(messages,/<#assign p="bad">/);assert.match(messages,/\{0\}.*\{1\}/);
  assert.match(html,/href="\$\{link\}"/);assert.match(plain,/\$\{link\}/);assert.match(html,/output_format="HTML" auto_esc=true/);
  assert.match(await readFile(join(directory,'theme.properties'),'utf8'),/parent=keycloak/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
