import {Sun,Moon,Monitor} from 'lucide-react';
import type {StudioAppearance} from './appearance';
import './appearance-control.css';

const modes=[{value:'light',label:'Light',Icon:Sun},{value:'dark',label:'Dark',Icon:Moon},{value:'system',label:'System',Icon:Monitor}] as const;

export function AppearanceSwitch({value,onChange}:{value:StudioAppearance;onChange:(value:StudioAppearance)=>void}){
  return <div className="appearance-switch" role="group" aria-label="Appearance">
    {modes.map(({value:mode,label,Icon})=><button key={mode} type="button" aria-label={label} title={`${label} appearance`} aria-pressed={value===mode} onClick={()=>onChange(mode)}><Icon aria-hidden="true"/></button>)}
  </div>;
}
