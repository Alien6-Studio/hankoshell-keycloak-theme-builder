import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {stat} from 'node:fs/promises';
const require=createRequire(import.meta.url);
let contractsStamp=0,loadedContracts;
async function currentContracts(){const stamp=(await stat(new URL('./dist/contracts.cjs',import.meta.url))).mtimeMs;if(stamp!==contractsStamp){delete require.cache[require.resolve('./dist/contracts.cjs')];loadedContracts=require('./dist/contracts.cjs');contractsStamp=stamp;}return loadedContracts;}
export default defineConfig({base:'./',build:{outDir:'site',emptyOutDir:true,target:'es2022',rollupOptions:{input:{index:fileURLToPath(new URL('./index.html',import.meta.url)),directions:fileURLToPath(new URL('./design-proposals.html',import.meta.url))}}},plugins:[react(),{name:'studio-contracts',configureServer(server){server.middlewares.use('/__studio/contracts',async(req,res)=>{res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');const contracts=await currentContracts();const route=req.url?.split('?')[0].replace(/^\//,'');if(req.method==='GET'&&contracts.schemas[route]){res.end(JSON.stringify(contracts.bundle(route)));return;}if(req.method==='POST'&&route==='validate'){try{let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>41*1024*1024)throw Error('Document trop volumineux.');chunks.push(chunk);}const {kind,document}=JSON.parse(Buffer.concat(chunks).toString());res.end(JSON.stringify(contracts.validate(kind,document)));}catch{res.statusCode=400;res.end(JSON.stringify({valid:false,errors:['Document invalide.']}));}return;}res.statusCode=404;res.end('{}');});}}],resolve:{dedupe:['react','react-dom']},css:{postcss:{plugins:[tailwind()]}},server:{host:'127.0.0.1',port:7425,strictPort:true}});
