'use client';
import {useEffect,useState} from 'react';
import {validateEditableProject} from './editable-project';
import {Studio} from './main';
import {HostContext,PortalContext,type StudioProps} from './host';
import {StudioInterfaceProvider} from './interface-context';
import {resolveInterfaceLocale,interfaceTranslator} from './interface-locale';
import {readLocalProjects,writeLocalProject,type LocalStudioRecord} from './local-library';
export type {StudioProps,StudioProject,StudioBuild,StudioDestination,StudioPublicationHost} from './host';
export function ThemeStudio(props:StudioProps){
  const interfaceLocale=resolveInterfaceLocale(props.interfaceLocale||props.initialLocale),ui=interfaceTranslator(interfaceLocale);
  const [portal,setPortal]=useState<HTMLDivElement|null>(null);
  const [system,setSystem]=useState<'light'|'dark'>('light');
  const localMode=!props.embedded&&!props.onSave;
  const [local,setLocal]=useState<{ready:boolean;records:LocalStudioRecord[];failed?:boolean}>({ready:!localMode,records:[]});
  useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const update=()=>setSystem(media.matches?'dark':'light');update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{if(!localMode)return;let active=true;readLocalProjects().then(async records=>{for(const record of records){if(!record.id||!['project','template'].includes(record.kind))throw Error('Invalid local record');await validateEditableProject(record.document);}if(active)setLocal({ready:true,records});}).catch(()=>{if(active)setLocal({ready:true,records:[],failed:true});});return()=>{active=false;};},[localMode]);
  const resolved:StudioProps=localMode&&!local.failed?{...props,initialProject:props.initialProject||local.records.find(record=>record.id==='draft')?.document,templates:local.records.filter(record=>record.kind==='template'),onSave:async document=>{await writeLocalProject({id:'draft',name:document.name,kind:'project',document,updatedAt:new Date().toISOString()});},onSaveTemplate:async(name,document)=>{const record:LocalStudioRecord={id:crypto.randomUUID(),name,kind:'template',document,updatedAt:new Date().toISOString()};await writeLocalProject(record);setLocal(previous=>({...previous,records:[record,...previous.records]}));},onLoadTemplate:async id=>{const record=(await readLocalProjects()).find(record=>record.id===id&&record.kind==='template');if(!record)throw Error(ui('Template not found.'));return await validateEditableProject(record.document);}}:props;
  return <StudioInterfaceProvider locale={interfaceLocale}><div className="hanko-theme-studio" lang={interfaceLocale} data-interface-locale={interfaceLocale} dir="ltr" data-embedded={!!props.embedded} data-theme={props.colorScheme&&props.colorScheme!=='system'?props.colorScheme:system}><HostContext.Provider value={resolved}><PortalContext.Provider value={portal}>{local.failed&&<p role="alert">{ui('The local library is unavailable. Saving is disabled; export your project to keep your work.')}</p>}{local.ready?<Studio key={props.context?.id||'standalone'}/>:<p role="status">{ui('Loading Studio…')}</p>}<div ref={setPortal}/></PortalContext.Provider></HostContext.Provider></div></StudioInterfaceProvider>;
}
