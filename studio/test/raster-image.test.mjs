import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const bundled=await build({entryPoints:[fileURLToPath(new URL('../src/raster-image.tsx',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const {rasterImageSource}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const data=(mime,bytes)=>`data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
const png=await readFile(new URL('../../test/fixtures/raster-study.png',import.meta.url));

test('accepted raster bytes retain canonical, fixed image MIME prefixes',()=>{
 for(const [mime,bytes] of [['image/png',png],['image/jpeg',[255,216,255,224,0,16]],['image/webp',[82,73,70,70,4,0,0,0,87,69,66,80]]]){
  const source=data(mime,bytes);
  assert.equal(rasterImageSource(source),source,mime);
 }
});
test('document input cannot supply an active MIME type, URL scheme or HTML attribute',()=>{
 const payload='<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>';
 for(const source of [
  data('image/svg+xml',payload),data('text/html','<script>alert(1)</script>'),
  data('image/png;charset=utf-8',png),data('image/png" onerror="alert(1)',png),
  data('image/png/svg+xml',png),data('image/png\n',png),
  'javascript:alert(1)','https://example.test/image.png','//example.test/image.png','blob:https://example.test/image',
  data('image/png',png)+'" onerror="alert(1)',
 ])assert.equal(rasterImageSource(source),undefined,source.slice(0,100));
});
test('the declared image format must match its binary signature',()=>{
 for(const mime of ['image/png','image/jpeg','image/webp'])assert.equal(rasterImageSource(data(mime,'<svg onload="alert(1)"/>')),undefined,mime);
 assert.equal(rasterImageSource(data('image/jpeg',png)),undefined);
 assert.equal(rasterImageSource(data('image/webp',png)),undefined);
 assert.equal(rasterImageSource(data('image/webp',[82,73,70,70,0,0,0,0])),undefined);
});
test('malformed, oversized and non-string image sources are rejected',()=>{
 for(const source of [null,{},42,'','data:image/png;base64,%%%','data:image/png;base64,A','data:image/png;base64,'+'A'.repeat(7*1024*1024)])assert.equal(rasterImageSource(source),undefined);
});
