import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const repository='Alien6-Studio/hankoshell-keycloak-theme-builder';
const packages=['@alien6-studio/hankoshell-keycloak-theme-builder','@alien6-studio/hankoshell-theme-studio'];
export function releaseVersion(tag){
  assert.ok(typeof tag==='string'&&tag===tag.trim(),'A version tag is required');
  assert.match(tag??'',/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/,'A version tag is required');
  return tag.slice(1);
}
export function assertRegistryIntegrity(metadata,bytes){
  const integrity='sha512-'+createHash('sha512').update(bytes).digest('base64');
  assert.equal(metadata?.dist?.integrity,integrity,'The published version contains different bytes');
}

async function main(){
  assert.equal(process.env.GITHUB_ACTIONS,'true','Publication requires the authorized GitHub workflow');
  assert.equal(process.env.GITHUB_REPOSITORY,repository);
  const tag=process.env.RELEASE_TAG,version=releaseVersion(tag);
  const release=JSON.parse(execFileSync('gh',['api',`repos/${repository}/releases/tags/${tag}`],{encoding:'utf8'}));
  assert.equal(release.tag_name,tag);assert.equal(release.draft,false);
  const directory=await mkdtemp(join(tmpdir(),'hanko-npm-release-'));
  try{
    const candidates=packages.map(name=>({name,file:name.slice(1).replace('/','-')+'-'+version+'.tgz'}));
    execFileSync('gh',['release','download',tag,'--repo',repository,'--dir',directory,'--pattern','SHA256SUMS',...candidates.flatMap(candidate=>['--pattern',candidate.file])],{stdio:'inherit'});
    const verify=file=>execFileSync('gh',['attestation','verify',file,'--repo',repository,'--signer-workflow',repository+'/.github/workflows/release.yml','--source-ref','refs/tags/'+tag,'--deny-self-hosted-runners'],{stdio:'inherit'});
    const sums=join(directory,'SHA256SUMS');verify(sums);
    const expected=new Map((await readFile(sums,'utf8')).trim().split('\n').map(line=>{const match=/^([a-f0-9]{64})\s+\*?(.+)$/.exec(line);assert.ok(match,'Invalid checksum manifest');return [match[2],match[1]];}));
    for(const candidate of candidates){
      candidate.path=join(directory,candidate.file);candidate.bytes=await readFile(candidate.path);
      assert.equal(createHash('sha256').update(candidate.bytes).digest('hex'),expected.get(candidate.file),'Release checksum mismatch');
      verify(candidate.path);
      const manifest=JSON.parse(execFileSync('tar',['-xOf',candidate.path,'package/package.json'],{encoding:'utf8'}));
      assert.equal(manifest.name,candidate.name);assert.equal(manifest.version,version);
      const response=await fetch(`https://registry.npmjs.org/${candidate.name}/${version}`);
      if(response.status===404)candidate.publish=true;
      else{assert.equal(response.status,200,'Cannot read registry state');assertRegistryIntegrity(await response.json(),candidate.bytes);candidate.publish=false;}
    }
    for(const candidate of candidates){
      if(!candidate.publish){console.log('Already published with matching integrity: '+candidate.name+'@'+version);continue;}
      execFileSync('npm',['publish',candidate.path,'--provenance','--access','public','--tag',version.includes('-')?'preview':'latest'],{stdio:'inherit'});
    }
  }finally{await rm(directory,{recursive:true,force:true});}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
