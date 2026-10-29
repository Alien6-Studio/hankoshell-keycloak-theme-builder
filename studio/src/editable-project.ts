import {requireValidDocument} from './contract-client';
import type {StudioProject} from './host';
export async function validateEditableProject(document:unknown,base?:string):Promise<StudioProject>{
 await requireValidDocument(base,'project',document);
 return assertEditableProject(document);
}
export function assertEditableProject(document:unknown):StudioProject{
 const project=document as StudioProject&{plugins?:unknown[]};
 const limits:Record<string,number>={login:3,email:3,account:5,admin:6,welcome:1};
 if(Object.hasOwn(project,'theme')||Object.hasOwn(project,'outputs')||project.plugins?.length)throw Error('Ce projet utilise des options qui ne sont pas encore prises en charge par l’éditeur.');
 for(const[key,page]of Object.entries(project.pages)){
  const[family,index]=key.split(':');
  if(!Object.hasOwn(limits,family)||!/^\d+$/.test(index)||Number(index)>=limits[family]||Object.hasOwn(page,'application')||page.blocks.some(block=>!['heading','text','image','divider','button'].includes(block.type)))throw Error('Ce projet nécessite un écran ou un bloc non installé.');
 }
 return project;
}
