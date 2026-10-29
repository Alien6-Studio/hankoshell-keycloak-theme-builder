import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
export async function staticServer(directory){
 const root=resolve(directory),prefix='/theme-studio/';
 const server=createServer(async(request,response)=>{
  response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  try{
   const path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   if(!path.startsWith(prefix))throw Error('Not found');
   let file=resolve(root,path.slice(prefix.length)||'index.html');if(!file.startsWith(root+sep))throw Error('Not found');
   if((await stat(file)).isDirectory())file=resolve(file,'index.html');
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
   response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});response.end(await readFile(file));
  }catch{response.writeHead(404);response.end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{url:`http://127.0.0.1:${server.address().port}${prefix}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
