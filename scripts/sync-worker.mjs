import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';import {fileURLToPath} from 'node:url';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),target=resolve(process.argv[2]||resolve(root,'../hanko-platform'));
const result=spawnSync('npm',['pack','--json','--pack-destination',tmpdir()],{cwd:root,encoding:'utf8',env:process.env});if(result.status!==0)throw Error(result.stderr||result.stdout);
const packed=JSON.parse(result.stdout)[0],archive=await readFile(resolve(tmpdir(),packed.filename)),destination=resolve(target,'packages/hanko-theme/vendor');await mkdir(destination,{recursive:true});
try{const previous=await readFile(resolve(destination,packed.filename));if(!previous.equals(archive))throw Error('This compiler version already has a different archive. Increment its version.');}catch(error){if(error.code!=='ENOENT')throw error;}
await copyFile(resolve(tmpdir(),packed.filename),resolve(destination,packed.filename));
const hash=createHash('sha256');async function visit(directory){for(const entry of(await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const path=resolve(directory,entry.name);if(entry.isDirectory())await visit(path);else{hash.update(relative(root,path));hash.update(await readFile(path));}}}
for(const directory of ['src','scripts','studio/contracts','studio/docs/screenshots'])await visit(resolve(root,directory));for(const name of ['package.json','package-lock.json','README.md']){hash.update(name);hash.update(await readFile(resolve(root,name)));}
await writeFile(resolve(destination,'theme-compiler-source.json'),JSON.stringify({package:packed.name,version:packed.version,source:'Alien6-Studio/hankoshell-keycloak-theme-builder',sourceSha256:hash.digest('hex'),archiveSha256:createHash('sha256').update(archive).digest('hex')},null,2)+'\n');console.log('Packed compiler: '+packed.filename);
