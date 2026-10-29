import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import {build} from 'esbuild';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function generateContracts(){
 const kinds=['theme','page','project','plugin','catalog','translations'];
 const schemas=Object.fromEntries(await Promise.all(kinds.map(async kind=>[kind,JSON.parse(await readFile(resolve(root,`contracts/${kind}.schema.json`),'utf8'))])));
 const ajv=new Ajv2020({strict:true,allErrors:true,ownProperties:true,code:{source:true,esm:true}});
 for(const schema of Object.values(schemas))ajv.addSchema(schema);
 ajv.addSchema({$id:'urn:hanko:studio:props-meta:v1',$ref:'https://json-schema.org/draft/2020-12/schema'});
 const names=Object.fromEntries(kinds.map(kind=>['v_'+kind,schemas[kind].$id]));names.v_props='urn:hanko:studio:props-meta:v1';
 const generated=standalone(ajv,names);
 const adapter=`\nconst schemas=${JSON.stringify(schemas)};
const {createValidator}=require('./contracts/core.cjs');
const validators={${kinds.map(kind=>JSON.stringify(schemas[kind].$id)+':v_'+kind).join(',')}};
const contracts=createValidator({getSchema:id=>validators[id],validateSchema:v_props},schemas);
export const validate=contracts.validate;export const bundle=contracts.bundle;`;
 const result=await build({stdin:{contents:generated+adapter,resolveDir:root},bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,write:false});
 const directory=resolve(root,'src/generated');await mkdir(directory,{recursive:true});
 await writeFile(resolve(directory,'browser-contracts.js'),result.outputFiles[0].text);
 return schemas;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await generateContracts();console.log('Generated browser validators without runtime code compilation.');}
