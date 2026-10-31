import {readFile,writeFile,mkdir,copyFile,readdir,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),input=process.argv[2];
if(!input)throw Error('Usage: npm run catalog:update -- /path/to/theme-catalog.tgz');
const archive=resolve(input),metadata=JSON.parse(execFileSync('tar',['-xOf',archive,'package/package.json'],{encoding:'utf8'}));
if(metadata.name!=='@alien6/hankoshell-theme-catalog')throw Error('Expected a HankoShell theme catalogue package.');
const source=JSON.parse(execFileSync('tar',['-xOf',archive,'package/dist/source.json'],{encoding:'utf8'}));
if(source.repository!=='Alien6-Studio/hankoshell-theme-catalog'||source.version!==metadata.version||!/^[a-f0-9]{64}$/.test(source.contentSha256))throw Error('Invalid catalogue provenance.');
const digest=createHash('sha256').update(await readFile(archive)).digest('hex');
const name=`alien6-hankoshell-theme-catalog-${metadata.version}-${digest.slice(0,12)}.tgz`,vendor=resolve(root,'vendor');
await mkdir(vendor,{recursive:true});if(archive!==resolve(vendor,name))await copyFile(archive,resolve(vendor,name));
for(const [directory,field,path]of [[root,'devDependencies','vendor/'],[resolve(root,'studio'),'devDependencies','../vendor/']]){
 const file=resolve(directory,'package.json'),pkg=JSON.parse(await readFile(file,'utf8'));
 pkg[field]['@alien6/hankoshell-theme-catalog']='file:'+path+name;await writeFile(file,JSON.stringify(pkg,null,2)+'\n');
 execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:directory,stdio:'inherit',env:{...process.env,npm_config_cache:process.env.npm_config_cache||resolve(root,'.theme-kit/npm-cache')}});
}
await writeFile(resolve(vendor,'theme-catalog-source.json'),JSON.stringify({...source,archive:name,archiveSha256:digest},null,2)+'\n');
for(const old of await readdir(vendor))if(old.startsWith('alien6-hankoshell-theme-catalog-')&&old.endsWith('.tgz')&&old!==name)await rm(resolve(vendor,old));
console.log(`Pinned catalogue ${metadata.version}: ${source.themes} themes / ${source.pages} pages, SHA-256 ${digest}.`);
