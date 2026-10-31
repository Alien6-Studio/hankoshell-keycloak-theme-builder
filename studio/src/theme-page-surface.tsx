import type {CSSProperties,HTMLAttributes} from 'react';
import {languages,type Locale} from './i18n';
import type {Family,Page} from './model';
import {frameVariables} from './frame-variables';

/** One frame for gallery thumbnails, exploration and the editable canvas. */
export function ThemePageSurface({page,family,locale,device='desktop',testing=true,children,...props}:{
  page:Page;family:Family;locale:Locale;device?:'desktop'|'mobile';testing?:boolean;
}&HTMLAttributes<HTMLDivElement>){
  const a=page.appearance;
  const style={
    ...frameVariables(page),
    maxWidth:device==='mobile'?375:a.contentWidth,fontFamily:a.font,
    '--page-accent':page.accent,'--page-bg':a.background,'--page-surface':a.surface,
    '--page-fg':a.foreground,'--page-muted':a.muted,'--page-radius':page.radius+'px',
    '--page-padding':a.padding+'px','--page-gap':a.gap+'px','--page-max':a.contentWidth+'px',
    ...props.style,
  } as CSSProperties;
  return <div className="theme-page-viewport" style={{width:'100%',maxWidth:device==='mobile'?375:a.contentWidth,marginInline:'auto',minWidth:0,containerType:'inline-size',containerName:'hanko-screen'}}><div {...props} className={'theme-page'+(props.className?' '+props.className:'')} data-hanko-frame={a.composition||page.preset}
    data-hanko-family={family} data-family={family} data-testing={testing} data-device={device}
    data-layout={page.layout} data-density={a.density} lang={locale} dir={languages[locale].direction} style={style}>{children}</div></div>;
}
