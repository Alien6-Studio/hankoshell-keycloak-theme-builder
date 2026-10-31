import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
export async function writeNotices(root,metafile){
 const directories=new Set(['ajv','react','react-dom'].map(name=>resolve(root,'node_modules',name)));
 for(const input of Object.keys(metafile.inputs)){const absolute=resolve(root,input),marker='/node_modules/',index=absolute.lastIndexOf(marker);if(index<0)continue;const suffix=absolute.slice(index+marker.length).split('/');directories.add(absolute.slice(0,index+marker.length)+suffix.slice(0,suffix[0].startsWith('@')?2:1).join('/'));}
 const notices=[];
 for(const directory of directories){let pkg;try{pkg=JSON.parse(await readFile(resolve(directory,'package.json'),'utf8'));}catch{continue;}let license='';for(const name of ['LICENSE','LICENSE.md','LICENSE.txt','license','license.md']){try{license=await readFile(resolve(directory,name),'utf8');break;}catch{}}
  notices.push({name:pkg.name,version:pkg.version,text:license||`License declared by package: ${pkg.license||'see package repository'}. ${pkg.homepage||''}`});
 }
 notices.push({name:'Catalogue font licences',version:'OFL-1.1',text:await readFile(createRequire(resolve(root,'package.json')).resolve('@alien6/hankoshell-theme-catalog/font-notices.txt'),'utf8')});
 notices.push({name:'HankoShell interface fonts: Inter, Unbounded, JetBrains Mono',version:'OFL-1.1',text:await readFile(resolve(root,'src/brand/OFL.txt'),'utf8')});
 notices.sort((a,b)=>a.name.localeCompare(b.name));const text='Third-party software notices — HankoShell Studio\n\n'+notices.map(item=>`${item.name} ${item.version}\n${'='.repeat(72)}\n${item.text.trim()}\n`).join('\n').replace(/\r\n?/g,'\n').replace(/[ \t]+$/gm,'');
 for(const name of ['dist/THIRD_PARTY_NOTICES.txt','public/THIRD_PARTY_NOTICES.txt']){const target=resolve(root,name);await mkdir(dirname(target),{recursive:true});await writeFile(target,text);}
 await writeFile(resolve(root,'public/LICENSE.txt'),await readFile(resolve(root,'LICENSE')));
}
