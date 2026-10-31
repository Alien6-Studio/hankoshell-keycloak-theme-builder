import {useUi} from './interface-context';
import type {InterfaceLocale} from './interface-locale';
export function InterfaceSwitch({value,onChange}:{value:InterfaceLocale;onChange:(locale:InterfaceLocale)=>void}){
  const ui=useUi();
  return <fieldset className="interface-switch" aria-label={ui('Interface language')}>
    {([{locale:'en',label:'English'},{locale:'fr',label:'Français'}]as const).map(({locale,label})=><button type="button" key={locale} lang={locale} aria-pressed={value===locale} onClick={()=>onChange(locale)}>{label}</button>)}
  </fieldset>;
}
