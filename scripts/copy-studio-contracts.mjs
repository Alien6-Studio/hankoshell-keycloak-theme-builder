import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),output=new URL('dist/studio-contracts/',root);
await mkdir(output,{recursive:true});
for(const name of ['theme','page','project','plugin','catalog','translations'].map(kind=>kind+'.schema.json').concat(['core.cjs','validate.cjs']))await copyFile(new URL('studio/contracts/'+name,root),new URL(name,output));

const {build}=await import('esbuild');
await build({entryPoints:[fileURLToPath(new URL('studio/src/composition-frame.ts',root))],outfile:fileURLToPath(new URL('dist/composition-frame.js',root)),bundle:true,format:'esm',target:'es2022'});
await copyFile(new URL('src/composition-frame.d.ts',root),new URL('dist/composition-frame.d.ts',root));
