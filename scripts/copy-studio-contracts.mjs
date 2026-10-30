import {mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),output=new URL('dist/studio-contracts/',root);
await mkdir(output,{recursive:true});
for(const name of ['theme','page','project','plugin','catalog','translations'].map(kind=>kind+'.schema.json').concat(['core.cjs','validate.cjs']))await copyFile(new URL('studio/contracts/'+name,root),new URL(name,output));
