import {Sun,Moon,Monitor} from 'lucide-react';
import {useUi} from './interface-context';
import type {StudioAppearance} from './appearance';
import './appearance-control.css';

const modes=[{value:'light',label:'Light',Icon:Sun},{value:'dark',label:'Dark',Icon:Moon},{value:'system',label:'System',Icon:Monitor}] as const;

export function AppearanceSwitch({value,onChange}:{value:StudioAppearance;onChange:(value:StudioAppearance)=>void}){
  const ui=useUi();
  return <fieldset className="appearance-switch" aria-label={ui('Appearance')}>
    {modes.map(({value:mode,label,Icon})=><button key={mode} type="button" aria-label={ui(label)} title={ui('Appearance: {mode}',{mode:ui(label)})} aria-pressed={value===mode} onClick={()=>onChange(mode)}><Icon aria-hidden="true"/></button>)}
  </fieldset>;
}
