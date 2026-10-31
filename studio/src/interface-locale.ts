import {interfaceMessages} from './interface-messages';
export type InterfaceLocale='en'|'fr';
export type UiValues=Record<string,string|number|{key:string;values?:UiValues}>;
export type UiMessage=string|{key:string;values?:UiValues}|UiMessage[];
export const interfaceLocaleStorageKey='hankoshell-studio-interface-locale';
const english=new Map<string,string>(),french=new Map<string,string>();
for(const [en,fr] of interfaceMessages){english.set(en,en);french.set(fr,fr);if(!english.has(fr))english.set(fr,en);if(!french.has(en))french.set(en,fr);}
export function parseInterfaceLocale(value:unknown):InterfaceLocale|undefined{
  if(typeof value!=='string')return undefined;
  try{const language=new Intl.Locale(value).language;if(language==='en'||language==='fr')return language;}catch{/* Unsupported language tags use the interface fallback. */}
  return undefined;
}
export function resolveInterfaceLocale(value:unknown,fallback:InterfaceLocale='en'):InterfaceLocale{return parseInterfaceLocale(value)||fallback;}
export function uiMessage(key:string,values?:UiValues){return {key,values};}
export function interfaceTranslator(locale:InterfaceLocale){
  const messages=locale==='fr'?french:english;
  const format=(input:UiMessage,values?:UiValues):string=>{
    if(Array.isArray(input))return input.map(value=>format(value)).filter(Boolean).join(' ');
    const key=typeof input==='string'?input:input.key,parameters=typeof input==='string'?values:input.values;
    const trimmed=key.trim(),translated=messages.get(key)??(messages.has(trimmed)?key.slice(0,key.indexOf(trimmed))+messages.get(trimmed)+key.slice(key.indexOf(trimmed)+trimmed.length):key);
    return translated.replace(/\{(\w+)\}/g,(placeholder,name)=>parameters&&Object.hasOwn(parameters,name)?typeof parameters[name]==='object'?format(parameters[name] as UiMessage):String(parameters[name]):placeholder);
  };
  return format;
}
export function readInterfaceLocale():InterfaceLocale{
  const requested=parseInterfaceLocale(new URLSearchParams(location.search).get('uiLocale'));
  if(requested)return requested;
  try{const saved=parseInterfaceLocale(localStorage.getItem(interfaceLocaleStorageKey));if(saved)return saved;}catch{/* Optional browser preference. */}
  for(const language of navigator.languages){const locale=parseInterfaceLocale(language);if(locale)return locale;}
  return 'en';
}
