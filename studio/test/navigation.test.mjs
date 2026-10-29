import test from 'node:test';import assert from 'node:assert/strict';import {generateSitemap} from '../scripts/sitemap.mjs';
const map=await generateSitemap();
test('navigation map contains every screen exactly once and has valid parents',()=>{
 assert.equal(map.screenNavigation.length,18);assert.equal(new Set(map.screenNavigation.map(screen=>screen.id)).size,18);
 for(const node of map.screenNavigation){if(node.parent)assert.ok(map.navigationScreen(node.parent));for(const link of map.previewLinksForScreen(node.id))if(link.target)assert.ok(map.navigationScreen(link.target),'Unknown transition: '+link.target);const path=map.screenAncestors(node.id);assert.equal(path.at(-1).id,node.id);assert.equal(new Set(path.map(screen=>screen.id)).size,path.length);}
 assert.deepEqual(map.screenAncestors('account:3').map(node=>node.label),['Sécurité','Authentification à deux facteurs']);
 assert.deepEqual(map.screenAncestors('admin:2').map(node=>node.label),['Console','Utilisateurs','Fiche utilisateur']);
});
test('section selection and child page selection follow the same hierarchy',()=>{
 assert.deepEqual(map.primaryScreens('account').map(node=>node.id),['account:0','account:1']);assert.equal(map.activePrimary('account:3').id,'account:1');assert.deepEqual(map.secondaryScreens('account:3').map(node=>node.id),['account:2','account:3','account:4']);
 assert.equal(map.activePrimary('admin:2').id,'admin:1');assert.deepEqual(map.secondaryScreens('admin:2').map(node=>node.id),['admin:2']);assert.equal(map.activePrimary('admin:4').id,'admin:3');
});
test('application sitemap states publication readiness and actual URL limitations',()=>{
 const xml=map.navigationXml();assert.match(xml,/<screen id="account:3"[^>]+parent="account:1"/);assert.match(xml,/view id="deploy"[^>]+status="preparation"/);assert.match(xml,/browser-history="not-yet-connected"/);assert.doesNotMatch(xml,/authenticatorSecret|Bearer |otpauth:/);
});
