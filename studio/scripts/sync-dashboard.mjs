import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(process.argv[2]||resolve(root,'../../hanko-platform'));
function run(args){const result=spawnSync('npm',args,{cwd:root,encoding:'utf8',env:{...process.env,npm_config_cache:process.env.THEME_STUDIO_NPM_CACHE||resolve(root,'../.theme-kit/npm-cache')}});if(result.status!==0)throw Error(result.stderr||result.stdout);return result.stdout;}
run(['run','build']);
const temporary=await import('node:os').then(os=>os.tmpdir());
const packed=JSON.parse(run(['pack','--json','--pack-destination',temporary]))[0];
const destination=resolve(target,'packages/dashboard/vendor');await mkdir(destination,{recursive:true});
const nextArchive=await readFile(resolve(temporary,packed.filename));
let previousArchive;try{previousArchive=await readFile(resolve(destination,packed.filename));}catch(error){if(error.code!=='ENOENT')throw error;}
if(previousArchive&&!previousArchive.equals(nextArchive))throw Error('This Studio version already has a different archive. Increment the package version before synchronization.');
await copyFile(resolve(temporary,packed.filename),resolve(destination,packed.filename));
const hash=createHash('sha256');
async function visit(dir){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const path=resolve(dir,entry.name);if(entry.isDirectory())await visit(path);else{hash.update(relative(root,path));hash.update(await readFile(path));}}}
for(const name of ['src','contracts','catalog','scripts','docs/screenshots'])await visit(resolve(root,name));
for(const name of ['package.json','package-lock.json','README.md']){hash.update(name);hash.update(await readFile(resolve(root,name)));}
const archive=await readFile(resolve(destination,packed.filename));
await writeFile(resolve(destination,'theme-studio-source.json'),JSON.stringify({package:packed.name,version:packed.version,source:'Alien6-Studio/hankoshell-keycloak-theme-builder/studio',sourceSha256:hash.digest('hex'),archiveSha256:createHash('sha256').update(archive).digest('hex')},null,2)+'\n');
console.log(`Packed ${packed.filename}. In ${target}, run:\nnpm uninstall --workspace=packages/dashboard @alien6/hankoshell-theme-studio --ignore-scripts\nnpm install --workspace=packages/dashboard ./packages/dashboard/vendor/${packed.filename} --ignore-scripts`);
