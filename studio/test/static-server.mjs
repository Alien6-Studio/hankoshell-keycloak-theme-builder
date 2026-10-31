import {createServer} from 'node:http';
import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
export async function staticServer(directory){
 const root=resolve(directory),prefix='/theme-studio/';
 const server=createServer(async(request,response)=>{
  response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  let handle;
  try{
   const path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   if(!path.startsWith(prefix))throw Error('Not found');
   const relative=path.slice(prefix.length),file=resolve(root,relative.endsWith('/')||!relative?relative+'index.html':relative);if(!file.startsWith(root+sep))throw Error('Not found');
   handle=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
   if(!(await handle.stat()).isFile())throw Error('Not found');
   const bytes=await handle.readFile();
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
   response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});response.end(bytes);
  }catch{response.writeHead(404);response.end('Not found');}
  finally{await handle?.close();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{url:`http://127.0.0.1:${server.address().port}${prefix}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
