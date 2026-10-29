import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {generateContracts} from './contracts.mjs';
import {generateSitemap} from './sitemap.mjs';
import {writeNotices} from './notices.mjs';
await generateSitemap();
await generateContracts();
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import selectorParser from 'postcss-selector-parser';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(resolve(root,'catalog/themes.json'),'utf8'));
const templatePaths=[...new Set(manifest.themes.flatMap(theme=>theme.templates.map(template=>template.path)))];
const registry="import catalogue from '../catalog/themes.json';\nexport {catalogue};\n"+templatePaths.map((path,index)=>`import page${index} from '../catalog/${path}';`).join('\n')+'\nexport const pageTemplates:Record<string,unknown>={'+templatePaths.map((path,index)=>JSON.stringify(path)+':page'+index).join(',')+'};\n';
if(await readFile(resolve(root,'src/catalog-data.ts'),'utf8')!==registry)await writeFile(resolve(root,'src/catalog-data.ts'),registry);
const dist=resolve(root,'dist');await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
const moduleBuild=await build({metafile:true,entryPoints:[resolve(root,'src/index.tsx')],outdir:dist,splitting:true,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',external:['react','react-dom','react/jsx-runtime','react-dom/client'],banner:{js:"'use client';"},minify:true,legalComments:'eof'});
const scope={postcssPlugin:'hanko-studio-scope',Rule(rule){
  for(let parent=rule.parent;parent;parent=parent.parent) if(parent.type==='rule'||parent.type==='atrule'&&/keyframes/.test(parent.name))return;
  rule.selector=selectorParser(selectors=>selectors.each(selector=>{
    const raw=String(selector).trim();
    if(raw.startsWith('.hanko-theme-studio'))return;
    if(/:root|:host|^(?:html|body)(?:\b|$)/.test(raw)){selector.replaceWith(selectorParser().astSync('.hanko-theme-studio').first);return;}
    if(/^\[data-theme=/.test(raw)){selector.prepend(selectorParser.className({value:'hanko-theme-studio'}));return;}
    selector.prepend(selectorParser.combinator({value:' '}));selector.prepend(selectorParser.className({value:'hanko-theme-studio'}));
  })).processSync(rule.selector);
}};
const css=await postcss([tailwind({base:root}),scope]).process(await readFile(resolve(root,'src/style.css'),'utf8'),{from:resolve(root,'src/style.css'),to:resolve(dist,'studio.css')});
await writeFile(resolve(dist,'studio.css'),css.css);
const kinds=['theme','page','project','plugin','catalog','translations'];
const schemas=Object.fromEntries(await Promise.all(kinds.map(async kind=>{
  const schema=JSON.parse(await readFile(resolve(root,`contracts/${kind}.schema.json`),'utf8'));
  return [kind,schema];
})));
await build({entryPoints:[resolve(root,'contracts/validate.cjs')],outfile:resolve(dist,'contracts.cjs'),bundle:true,platform:'node',format:'cjs',packages:'external'});
await writeFile(resolve(dist,'contracts.d.cts'),'declare const contracts:{validate(kind:string,document:unknown):{valid:boolean;errors:string[]};bundle(kind:string):unknown;schemas:Record<string,unknown>};export = contracts;\n');
await writeFile(resolve(dist,'catalog.json'),await readFile(resolve(root,'catalog/themes.json')));
await writeFile(resolve(dist,'index.d.ts'),"import type {ComponentType} from 'react';\nexport interface StudioProject{format:'hanko.theme-studio.project/v1';name:string;pages:Record<string,unknown>;media:unknown[];destination:{mode:string;url:string;realm:string;scope:string;client:string;theme:string};publication:{status:'draft';built:boolean;deployed:boolean;attached:boolean}}\nexport interface StudioProps{embedded?:boolean;initialView?:'editor'|'gallery';context?:{kind:'organization'|'cluster';id:string;label:string;realm?:string};initialProject?:StudioProject;initialBrand?:{name?:string;accent?:string;background?:string;foreground?:string;font?:string};initialLocale?:string;colorScheme?:'light'|'dark'|'system';contractsBase?:string;onSave?:(project:StudioProject)=>Promise<void>;templates?:{id:string;name:string;document?:StudioProject}[];onLoadTemplate?:(id:string)=>Promise<StudioProject>;onSaveTemplate?:(name:string,project:StudioProject)=>Promise<void>}\nexport declare const ThemeStudio:ComponentType<StudioProps>;\n");
await writeNotices(root,moduleBuild.metafile);
console.log('Built reusable Studio, scoped styles and server-side contracts.');
