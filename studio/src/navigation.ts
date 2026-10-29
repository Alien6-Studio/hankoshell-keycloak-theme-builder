import {families,type Family} from './model';
import {journeyScreens,type ScreenLink} from './journeys';
export interface NavigationScreen{id:string;family:Family;index:number;label:string;parent?:string;children:string[]}
export const screenNavigation:NavigationScreen[]=Object.entries(families).flatMap(([family,definition])=>definition.pages.map((label,index)=>({id:`${family}:${index}`,family:family as Family,index,label,parent:journeyScreens[`${family}:${index}`]?.parent,children:[]})));
for(const node of screenNavigation)node.children=screenNavigation.filter(child=>child.parent===node.id).map(child=>child.id);
export const studioViews=[
 {id:'editor',label:'Composer',status:'available',panels:['Blocs','Styles','Médias','Calques']},
 {id:'catalog',label:'Galerie de modèles',status:'available',panels:['Thèmes complets','Pages','Sections réutilisables','Mes modèles']},
 {id:'translations',label:'Traductions',status:'available',panels:['Langues','Textes','Import et export']},
 {id:'contracts',label:'Contrats JSON',status:'available',panels:['Page','Projet','Plugin déclaratif','Catalogue']},
 {id:'validate',label:'Vérifier l’écran',status:'available',panels:[]},
 {id:'build',label:'Construire',status:'preparation',panels:[]},
 {id:'deploy',label:'Déployer',status:'preparation',panels:[]},
 {id:'attach',label:'Affecter',status:'preparation',panels:[]},
] as const;
export type StudioView=(typeof studioViews)[number]['id'];
export function navigationScreen(id:string){return screenNavigation.find(node=>node.id===id);}
export function screenAncestors(id:string):NavigationScreen[]{const path:NavigationScreen[]=[];const seen=new Set<string>();let node=navigationScreen(id);while(node){if(seen.has(node.id))throw Error('Navigation cycle: '+node.id);seen.add(node.id);path.unshift(node);node=node.parent?navigationScreen(node.parent):undefined;}return path;}
export function rootScreens(family:Family){return screenNavigation.filter(node=>node.family===family&&!node.parent);}
export function primaryScreens(family:Family){return family==='admin'?screenNavigation.filter(node=>node.family===family&&(!node.parent||node.parent==='admin:0')):rootScreens(family);}
export function activePrimary(id:string){const node=navigationScreen(id);if(!node)return undefined;const primary=new Set(primaryScreens(node.family).map(entry=>entry.id));return [...screenAncestors(id)].reverse().find(entry=>primary.has(entry.id));}
export function secondaryScreens(id:string){const node=navigationScreen(id);if(!node)return[];const parent=activePrimary(id);return parent?parent.children.map(key=>navigationScreen(key)!).filter(child=>!primaryScreens(node.family).some(primary=>primary.id===child.id)):[];}
export function previewLinksForScreen(id:string):ScreenLink[]{const screen=navigationScreen(id);if(!screen)return[];const configured=journeyScreens[id];if(configured)return configured.links;if(screen.family==='login')return[{part:'action',target:'account:0',label:['Se connecter','Créer mon compte','Vérifier'][screen.index]}];if(screen.family==='email')return[{part:'action',target:'login:0',label:['Confirmer mon adresse','Réinitialiser mon mot de passe','Vérifier'][screen.index]}];return screen.family==='welcome'?[{part:'action',target:'login:0',label:'Se connecter'}]:[];}
const xml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function navigationXml(){
 const lines=['<?xml version="1.0" encoding="UTF-8"?>','<studio-sitemap xmlns="urn:hanko:theme-studio:navigation:v1" version="1" purpose="application-navigation">','  <!-- UI states and preview transitions; this is not a search-engine URL sitemap. -->','  <workspace id="studio" label="Theme Studio">'];
 for(const view of studioViews){lines.push(`    <view id="${view.id}" label="${xml(view.label)}" status="${view.status}">`);for(const label of view.panels)lines.push(`      <panel label="${xml(label)}" />`);lines.push('    </view>');}lines.push('  </workspace>','  <theme-screens>');
 function screen(node:NavigationScreen,depth:number){const indent='  '.repeat(depth);lines.push(`${indent}<screen id="${node.id}" label="${xml(node.label)}"${node.parent?` parent="${node.parent}"`:''}>`,`${indent}  <editor-state family="${node.family}" page="${node.index}" />`);for(const link of previewLinksForScreen(node.id))lines.push(link.target?`${indent}  <transition mode="preview" field="${link.part}" target="${link.target}" label="${xml(link.label)}" />`:`${indent}  <local-action field="${link.part}" label="${xml(link.label)}" result="${xml(link.result||'')}" />`);for(const id of node.children)screen(navigationScreen(id)!,depth+1);lines.push(`${indent}</screen>`);}
 for(const [family,definition]of Object.entries(families)){lines.push(`    <family id="${family}" label="${xml(definition.label)}">`);for(const node of rootScreens(family as Family))screen(node,3);lines.push('    </family>');}lines.push('  </theme-screens>','  <navigation-contract addressability="in-memory" browser-history="not-yet-connected" />','  <hosts>','    <host kind="standalone" route="/" />','    <host kind="organization" route-template="/[locale]/clusters/[clusterId]/backends/[backendId]/organizations/[realm]/theme" />','    <host kind="cluster" route-template="/[locale]/platform/themes/studio" />','  </hosts>','</studio-sitemap>');return lines.join('\n')+'\n';
}
