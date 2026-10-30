import type {StudioProject} from './host';
import {assertEditableProject} from './editable-project';
import {screenNavigation} from './navigation';
import {journeyText} from './journeys';
import {languages,type Locale} from './i18n';
import runtime from './application-runtime.tsx?raw';

/** Export actual authored pages; React is the only required package. */
export function applicationSource(project:StudioProject):string {
 assertEditableProject(project);
 const pages=Object.fromEntries(Object.entries(project.pages).filter(([id])=>/^(account:[0-4]|admin:[0-5]|welcome:0)$/.test(id)));
 if(!Object.keys(pages).length)throw Error('Ajoutez une page Compte, Administration ou Accueil avant d’exporter les écrans applicatifs.');
 const navigation=screenNavigation.filter(node=>Object.hasOwn(pages,node.id)).map(node=>({id:node.id,parent:node.parent&&Object.hasOwn(pages,node.parent)?node.parent:undefined,labels:Object.fromEntries(Object.keys(languages).map(locale=>[locale,journeyText(node.label,locale as Locale)]))}));
 const document=JSON.stringify({name:project.name,pages,navigation},null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return runtime+'\nexport const project: IdentityProject = '+document+';\nexport const {IdentityScreen,applicationScreenIds,ProfileScreen,SecurityScreen,PasswordScreen,AuthenticatorScreen,SessionsScreen,AdministrationScreen,UsersScreen,UserScreen,ClientsScreen,ClientScreen,PermissionsScreen,WelcomeScreen}=createIdentityTheme(project);\n';
}
