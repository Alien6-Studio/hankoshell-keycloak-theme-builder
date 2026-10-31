import {createContext,useContext} from 'react';
import type {Asset,Page} from './model';
export interface StudioProject {
  format:'hanko.theme-studio.project/v1'; name:string; pages:Record<string,Page>; media:Asset[];
  destination:{mode:string;url:string;realm:string;scope:string;client:string;theme:string};
  publication:{status:'draft';built:boolean;deployed:boolean;attached:boolean};
}
export interface StudioDestination {realm:string;scope:'realm'|'client';client:string;types:('login'|'email')[]}
export interface StudioBuild {
  id:string;projectRevision:number;projectSha256:string;themeName:string;types:('login'|'email')[];
  phase:'Building'|'Installing'|'Ready'|'Error';error?:string;
  attachment:'none'|'attaching'|'attached'|'rolling_back'|'rolled_back';destination:Partial<StudioDestination>;
  createdAt:string;updatedAt:string;
}
export interface StudioPublicationHost {
  builds?:StudioBuild[];
  build:(project:StudioProject)=>Promise<StudioBuild>;
  status:(id:string)=>Promise<StudioBuild>;
  attach:(id:string,destination:StudioDestination)=>Promise<StudioBuild>;
  rollback:(id:string)=>Promise<StudioBuild>;
}
export interface StudioProps {
  embedded?:boolean;
  initialView?:'editor'|'gallery';initialGallery?:{collection?:string;theme?:string;page?:string};
  context?:{kind:'organization'|'cluster';id:string;label:string;realm?:string};
  initialProject?:StudioProject;
  initialBrand?:{name?:string;accent?:string;background?:string;foreground?:string;font?:string};
  initialLocale?:string;
  colorScheme?:'light'|'dark'|'system';
  contractsBase?:string;
  onSave?:(project:StudioProject)=>Promise<void>;
  templates?:{id:string;name:string;document?:StudioProject}[];
  onLoadTemplate?:(id:string)=>Promise<StudioProject>;
  onSaveTemplate?:(name:string,project:StudioProject)=>Promise<void>;
  publication?:StudioPublicationHost;
}
export const HostContext=createContext<StudioProps>({});
export const PortalContext=createContext<HTMLElement|null>(null);
export function useStudioHost(){return useContext(HostContext);}
export function useStudioPortal(){return useContext(PortalContext);}
export function useContractBase(){return useStudioHost().contractsBase;}
