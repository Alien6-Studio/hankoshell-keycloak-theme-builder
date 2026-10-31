import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeStudio} from './index';
import {TemplatePreview,themePages} from './template-gallery';
import {catalogue} from './catalog-data';
import {resolveLocale} from './i18n';
import {appearanceStorageKey,readAppearance,type StudioAppearance} from './appearance';
import {AppearanceSwitch} from './AppearanceSwitch';
import './style.css';
import {StudioInterfaceProvider,useUi} from './interface-context';
import {readInterfaceLocale,interfaceLocaleStorageKey} from './interface-locale';
import {InterfaceSwitch} from './InterfaceSwitch';
const parameters=new URLSearchParams(location.search);
const preview=parameters.get('preview');
const locale=resolveLocale(parameters.get('locale')||undefined,'en');
const initialView=parameters.get('view')==='editor'?'editor':'gallery';
const requestedScreen=parameters.get('screen'),screen=catalogue.themes[0].templates.some(template=>template.editorPage===requestedScreen)?requestedScreen!:requestedScreen==='account'?'account:0':requestedScreen==='security'?'account:1':undefined;
const initialGallery={collection:parameters.get('collection')||undefined,theme:parameters.get('direction')||undefined,page:screen};
function StandaloneStudio(){
  const [interfaceLocale,setInterfaceLocale]=useState(readInterfaceLocale);
  return <StudioInterfaceProvider locale={interfaceLocale}><StandaloneView interfaceLocale={interfaceLocale} onInterfaceLocale={setInterfaceLocale}/></StudioInterfaceProvider>;
}
function StandaloneView({interfaceLocale,onInterfaceLocale}:{interfaceLocale:ReturnType<typeof readInterfaceLocale>;onInterfaceLocale:(value:ReturnType<typeof readInterfaceLocale>)=>void}){
  const ui=useUi();
  useEffect(()=>{document.documentElement.lang=interfaceLocale;try{localStorage.setItem(interfaceLocaleStorageKey,interfaceLocale);}catch{/* Optional browser preference. */}const url=new URL(location.href);url.searchParams.set('uiLocale',interfaceLocale);history.replaceState(null,'',url);},[interfaceLocale]);
  const [appearance,setAppearance]=useState<StudioAppearance>(readAppearance);
  const [system,setSystem]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const resolved=appearance==='system'?system:appearance;
  useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const update=()=>setSystem(media.matches?'dark':'light');media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{try{localStorage.setItem(appearanceStorageKey,appearance);}catch{/* Optional browser preference. */}const url=new URL(location.href);url.searchParams.set('scheme',appearance);history.replaceState(null,'',url);document.documentElement.dataset.theme=resolved;},[appearance,resolved]);
  if(preview&&catalogue.themes.some(theme=>theme.id===preview))return <div className="hanko-theme-studio" lang={locale} data-theme={resolved}><TemplatePreview pages={themePages(preview)} initial={screen} locale={locale}/></div>;
  return <div className="standalone-studio" lang={interfaceLocale} data-theme={resolved}>
    <div className="studio-demo-banner">
      <a href={`../?scheme=${appearance}`}>← HankoShell Studio</a>
      <p><strong>{ui('Open-source demo')}</strong><span>{ui('For any Keycloak project. Edit and export here; compile locally with the CLI.')}</span></p>
      <InterfaceSwitch value={interfaceLocale} onChange={onInterfaceLocale}/><AppearanceSwitch value={appearance} onChange={setAppearance}/>
      <nav className="studio-package-links" aria-label={ui('npm packages')}><a href="https://www.npmjs.com/package/@alien6-studio/hankoshell-keycloak-theme-builder" target="_blank" rel="noopener noreferrer">{ui('CLI on npm ↗')}</a><a href="https://www.npmjs.com/package/@alien6-studio/hankoshell-theme-studio" target="_blank" rel="noopener noreferrer">{ui('React Studio on npm ↗')}</a><a href="https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder#compile-a-studio-project" target="_blank" rel="noopener noreferrer">{ui('Build locally ↗')}</a></nav>
    </div>
    <ThemeStudio interfaceLocale={interfaceLocale} colorScheme={appearance} initialView={initialView} initialGallery={initialGallery} initialLocale={locale}/>
  </div>;
}
createRoot(document.getElementById('root')!).render(<StandaloneStudio/>);
