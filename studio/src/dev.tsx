import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeStudio} from './index';
import {TemplatePreview,themePages} from './template-gallery';
import {catalogue} from './catalog-data';
import {resolveLocale} from './i18n';
import {appearanceStorageKey,readAppearance,parseAppearance,type StudioAppearance} from './appearance';
import './style.css';
const parameters=new URLSearchParams(location.search);
const preview=parameters.get('preview');
const locale=resolveLocale(parameters.get('locale')||undefined,'en');
const initialView=parameters.get('view')==='editor'?'editor':'gallery';
const requestedScreen=parameters.get('screen'),screen=catalogue.themes[0].templates.some(template=>template.editorPage===requestedScreen)?requestedScreen!:requestedScreen==='account'?'account:0':requestedScreen==='security'?'account:1':undefined;
const initialGallery={collection:parameters.get('collection')||undefined,theme:parameters.get('direction')||undefined,page:screen};
function StandaloneStudio(){
  const [appearance,setAppearance]=useState<StudioAppearance>(readAppearance);
  const [system,setSystem]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const resolved=appearance==='system'?system:appearance;
  useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const update=()=>setSystem(media.matches?'dark':'light');media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{try{localStorage.setItem(appearanceStorageKey,appearance);}catch{/* Optional browser preference. */}const url=new URL(location.href);url.searchParams.set('scheme',appearance);history.replaceState(null,'',url);document.documentElement.dataset.theme=resolved;},[appearance,resolved]);
  if(preview&&catalogue.themes.some(theme=>theme.id===preview))return <div className="hanko-theme-studio" lang={locale} data-theme={resolved}><TemplatePreview pages={themePages(preview)} initial={screen} locale={locale}/></div>;
  return <div className="standalone-studio" data-theme={resolved}>
    <div className="studio-demo-banner">
      <a href={`../?scheme=${appearance}`}>← HankoShell Studio</a>
      <p><strong>Open-source demo</strong><span>For any Keycloak project. Edit and export here; compile locally with the CLI.</span></p>
      <label className="studio-appearance">Appearance<select value={appearance} onChange={event=>{const next=parseAppearance(event.target.value);if(next)setAppearance(next);}}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>
      <nav className="studio-package-links" aria-label="npm packages"><a href="https://www.npmjs.com/package/@alien6-studio/hankoshell-keycloak-theme-builder" target="_blank" rel="noopener noreferrer">CLI on npm ↗</a><a href="https://www.npmjs.com/package/@alien6-studio/hankoshell-theme-studio" target="_blank" rel="noopener noreferrer">React Studio on npm ↗</a><a href="https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder#compile-a-studio-project" target="_blank" rel="noopener noreferrer">Build locally ↗</a></nav>
    </div>
    <ThemeStudio colorScheme={appearance} initialView={initialView} initialGallery={initialGallery} initialLocale={locale}/>
  </div>;
}
createRoot(document.getElementById('root')!).render(<StandaloneStudio/>);
