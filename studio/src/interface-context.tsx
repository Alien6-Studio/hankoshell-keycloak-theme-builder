import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {interfaceTranslator,type InterfaceLocale} from './interface-locale';
const InterfaceContext=createContext<InterfaceLocale>('en');
export function StudioInterfaceProvider({locale,children}:{locale:InterfaceLocale;children:ReactNode}){
  return <InterfaceContext.Provider value={locale}>{children}</InterfaceContext.Provider>;
}
export function useInterfaceLocale(){return useContext(InterfaceContext);}
export function useUi(){const locale=useInterfaceLocale();return useMemo(()=>interfaceTranslator(locale),[locale]);}
