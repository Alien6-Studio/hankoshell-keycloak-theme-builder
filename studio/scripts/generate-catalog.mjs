import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const repository=resolve(root,'..'),target=resolve(repository,'../hankoshell-theme-catalog');
const require=createRequire(resolve(repository,'package.json'));
const {chromium}=require('playwright');
const bundle=await build({stdin:{contents:"export * from './src/model';export * from './src/i18n';",resolveDir:root},bundle:true,platform:'node',format:'esm',write:false});
const {initialPage,stylePage,families,initializeI18n}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
await mkdir(resolve(target,'catalog'),{recursive:true});
await cp(resolve(root,'catalog'),resolve(target,'catalog'),{recursive:true});
await cp(resolve(repository,'LICENSE'),resolve(target,'LICENSE'));
let catalogue=JSON.parse(await readFile(resolve(root,'catalog/themes.json'),'utf8'));
const styles={
 essential:{name:'Essentiel',description:'Clair, centré et lisible',accent:'#2558a1',background:'#eef3f8',surface:'#ffffff',foreground:'#192e48',muted:'#596b80',radius:16,layout:'center',font:'system-ui, sans-serif',density:'comfortable'},
 editorial:{name:'Éditorial',description:'Composition illustrée, serif et tons chauds',accent:'#9a411e',background:'#f5ede3',surface:'#fff9f0',foreground:'#34261d',muted:'#756252',radius:4,layout:'left',font:'Georgia, serif',density:'comfortable'},
 midnight:{name:'Minuit',description:'Interface sombre, visuel à droite et accent indigo',accent:'#a5b4fc',background:'#101522',surface:'#1b2337',foreground:'#f2f3f8',muted:'#abb4c7',radius:18,layout:'right',font:'system-ui, sans-serif',density:'comfortable'},
};
const art={
 essential:'<rect width="960" height="720" fill="#e4edf7"/><circle cx="480" cy="360" r="240" fill="#cfdded"/><g fill="#fff" stroke="#bdd0e6" stroke-width="3"><rect x="140" y="170" width="310" height="210" rx="30"/><rect x="510" y="300" width="310" height="210" rx="30"/><rect x="245" y="430" width="180" height="135" rx="24"/></g><g fill="#2558a1"><circle cx="250" cy="245" r="32"/><rect x="305" y="221" width="100" height="12" rx="6"/><rect x="305" y="249" width="75" height="10" rx="5" opacity=".3"/><circle cx="610" cy="370" r="32"/><rect x="665" y="346" width="100" height="12" rx="6"/><rect x="665" y="374" width="65" height="10" rx="5" opacity=".3"/><circle cx="335" cy="495" r="25"/></g><path d="M450 270Q620 160 665 300M510 420Q450 500 425 490" fill="none" stroke="#7b9dc8" stroke-width="5" stroke-dasharray="10 12"/>',
 editorial:'<rect width="960" height="720" fill="#e9d3b8"/><circle cx="780" cy="90" r="270" fill="#c38659"/><path d="M0 600C220 270 360 840 540 450S830 300 960 90V720H0Z" fill="#9a411e"/><path d="M0 100C240 260 190 650 480 470S800 240 960 530" fill="none" stroke="#f9ead5" stroke-width="85"/><circle cx="370" cy="270" r="102" fill="#fff9f0"/><circle cx="370" cy="270" r="45" fill="#9a411e"/><circle cx="660" cy="500" r="70" fill="#e9d3b8"/>',
 midnight:'<rect width="960" height="720" fill="#141c2d"/><g stroke="#33435f" stroke-width="2" fill="none"><path d="M0 120H960M0 240H960M0 360H960M0 480H960M0 600H960M120 0V720M240 0V720M360 0V720M480 0V720M600 0V720M720 0V720M840 0V720"/></g><g stroke="#a5b4fc" stroke-width="7" fill="none"><path d="M200 200H480V360H750M480 360V540H250"/></g><g fill="#1b2337" stroke="#a5b4fc" stroke-width="5"><rect x="125" y="125" width="150" height="150" rx="30"/><rect x="405" y="285" width="150" height="150" rx="30"/><rect x="675" y="285" width="150" height="150" rx="30"/><rect x="175" y="465" width="150" height="150" rx="30"/></g><g fill="#a5b4fc"><circle cx="200" cy="200" r="27"/><circle cx="480" cy="360" r="27"/><circle cx="750" cy="360" r="27"/><circle cx="250" cy="540" r="27"/></g>',
};
const ids={login:['login','register','otp'],email:['email-verification','email-password-reset','email-required-actions'],account:['account-profile','account-security','account-password','account-mfa','account-sessions'],admin:['admin-console','admin-users','admin-user','admin-clients','admin-client','admin-permissions'],welcome:['welcome']};
const browser=await chromium.launch({headless:true});
try{
 for(const [id,values]of Object.entries(styles)){
  const style={id,...values},dir=resolve(target,'catalog/themes',id);await mkdir(resolve(dir,'assets'),{recursive:true});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">${art[id]}</svg>`;
  await writeFile(resolve(dir,'assets/identity.svg'),svg);
  const page=await browser.newPage();const source='data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
  const png=await page.evaluate(async source=>{const img=new Image();img.src=source;await img.decode();const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;canvas.getContext('2d').drawImage(img,0,0);return canvas.toDataURL('image/png');},source);
  await page.close();const bytes=Buffer.from(png.split(',')[1],'base64');await writeFile(resolve(dir,'assets/identity.png'),bytes);
  const templates=[];
  for(const [family,definition]of Object.entries(families))for(let index=0;index<definition.pages.length;index++){
    let document=stylePage(initialPage(family,index),style);delete document.i18n;
    document.brand.align=id==='essential'?'center':'left';document.brand.mark='A';document.brand.size=28;document.brand.fontSize=16;
    document.appearance.contentWidth=id==='essential'?760:1100;document.appearance.padding=id==='essential'?28:32;document.appearance.gap=28;
    document.native.buttonColor=id==='midnight'?'#101522':values.surface;document.native.inputBorder=id==='midnight'?'#536078':id==='editorial'?'#a68b75':'#879cb5';
    document.native.padding=24;document.native.radius=values.radius;
    document.blocks=document.blocks.map((block,i)=>({...block,id:`${id}-${ids[family][index]}-${i}`,style:{...(block.type==='heading'?{fontSize:id==='editorial'?44:34,fontWeight:600,lineHeight:1.15}:{}),...(block.type==='text'?{fontSize:13,lineHeight:1.7}:{})}}));
    if(family==='login'||family==='welcome'){
      const visual=document.blocks.find(block=>block.type==='image');if(visual){visual.src=png;visual.alt='Votre identité, votre univers.';visual.style={imageHeight:id==='essential'?150:310,fit:'contain',radius:values.radius};}
      if(family==='login'&&index===0)document.blocks[0].text=id==='editorial'?'Votre identité,\nvotre univers.':id==='midnight'?'Une identité, tous vos services.':'Bienvenue dans votre espace';
    }
    document=initializeI18n(document);
    const path=`themes/${id}/pages/${ids[family][index]}.json`;await writeFile(resolve(target,'catalog',path),JSON.stringify(document,null,2)+'\n');
    templates.push({id:ids[family][index],name:definition.pages[index],surface:`keycloak-${family}`,editorPage:`${family}:${index}`,path,targets:family==='login'?['project-json','native-appearance']:family==='account'?['project-json','react-next']:['project-json']});
  }
  const native={version:1,name:id,headline:values.name,subline:'Une identité, tous vos services.',fontFamily:values.font,colors:Object.fromEntries(['light','dark'].map(mode=>[mode,{background:values.background,foreground:values.foreground,primary:values.accent,primaryForeground:id==='midnight'?'#101522':values.surface,card:values.surface,muted:values.muted,input:values.surface}])),layout:{cardRadius:values.radius+'px',controlRadius:Math.max(4,values.radius/2)+'px',contentWidth:'440px'}};
  await writeFile(resolve(dir,'theme.json'),JSON.stringify(native,null,2)+'\n');
  const entry=catalogue.themes.find(theme=>theme.id===id);Object.assign(entry,{complete:true,description:values.description,style,templates,assets:[{path:`themes/${id}/assets/identity.png`,source:`themes/${id}/assets/identity.svg`,license:'Apache-2.0',sha256:createHash('sha256').update(bytes).digest('hex')}]});
 }
}finally{await browser.close();}
const block=(id,type,zone,text)=>({id,type,zone,text,alt:'',align:'left'});
catalogue.sections=[
 {id:'welcome-banner',name:'Bandeau de bienvenue',description:'Titre et introduction en en-tête.',blocks:[block('section-title','heading','header','Votre espace personnel'),block('section-intro','text','header','Une identité, tous vos services.')]},
 {id:'help-panel',name:'Aide à la connexion',description:'Texte d’aide et lien vers la sécurité du compte.',blocks:[block('section-help-title','heading','aside','Protégez votre compte'),{...block('section-help-link','button','aside','Votre sécurité'),href:'#account-1'}]},
 {id:'legal-footer',name:'Pied de page sobre',description:'Séparateur et signature de marque.',blocks:[block('section-divider','divider','footer',''),block('section-signature','text','footer','Une identité, tous vos services.')]},
 {id:'security-links',name:'Accès à la sécurité',description:'Liens vers le mot de passe et la double authentification.',blocks:[{...block('section-password','button','aside','Modifier le mot de passe'),href:'#account-2'},{...block('section-mfa','button','aside','Configurer le MFA'),href:'#account-3'}]},
];
await writeFile(resolve(target,'catalog/themes.json'),JSON.stringify(catalogue,null,2)+'\n');
await cp(resolve(target,'catalog'),resolve(root,'catalog'),{recursive:true});
await writeFile(resolve(root,'catalog/source.json'),JSON.stringify({repository:'Alien6-Studio/hankoshell-theme-catalog',version:catalogue.version,license:'Apache-2.0'},null,2)+'\n');
console.log('Generated 3 complete themes, 54 pages, original licensed assets and 4 reusable sections.');
