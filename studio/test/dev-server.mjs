import {createServer} from 'vite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=fileURLToPath(new URL('..',import.meta.url));
const cache=await mkdtemp(join(tmpdir(),'studio-browser-cache-'));
let server;
try {
  server=await createServer({root,configFile:join(root,'vite.config.mjs'),cacheDir:cache,server:{host:'127.0.0.1',port:0,strictPort:true}});
  await server.listen();
  const port=server.httpServer.address().port;
  const code=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[join(root,'test/browser.mjs')],{env:{...process.env,STUDIO_URL:'http://127.0.0.1:'+port},stdio:'inherit'});
    child.on('error',reject);child.on('close',resolve);
  });
  if(code!==0)throw Error('Studio development-browser checks failed');
} finally {
  await server?.close();await rm(cache,{recursive:true,force:true});
}
