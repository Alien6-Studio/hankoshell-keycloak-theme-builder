import {createRoot} from 'react-dom/client';
import {ThemeStudio} from './index';
import {TemplatePreview,themePages} from './template-gallery';
import './style.css';
const preview=new URLSearchParams(location.search).get('preview');
createRoot(document.getElementById('root')!).render(preview&&['essential','editorial','midnight'].includes(preview)?<div className="hanko-theme-studio" data-theme="light"><TemplatePreview pages={themePages(preview)}/></div>:<ThemeStudio initialView="gallery"/>);
