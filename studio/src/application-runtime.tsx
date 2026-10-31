"use client";
import {useId,useState,type CSSProperties,type ReactNode,type InputHTMLAttributes,type ButtonHTMLAttributes} from 'react';

export type IdentityElementStyle={color?:string;background?:string;fontSize?:number;fontWeight?:number;padding?:number;margin?:number;radius?:number;width?:number;imageHeight?:number;fit?:'cover'|'contain';align?:'left'|'center'|'right';lineHeight?:number};
export interface IdentityPage {
 blocks:{id:string;type:'heading'|'text'|'image'|'divider'|'button';zone:'header'|'aside'|'footer';text:string;alt:string;src?:string;href?:string;align:'left'|'center'|'right';style?:IdentityElementStyle}[];
 layout:'left'|'center'|'right';accent:string;radius:number;
 brand:{name:string;mark:string;logo?:string;alt:string;size:number;fontSize:number;align:string;color:string};
 appearance:{composition?:string;background:string;foreground:string;surface:string;muted:string;font:string;headingFont?:string;padding:number;gap:number;contentWidth:number;backgroundImage?:string;backgroundFit:string};
 native:{fieldStyle?:string;actionSize?:string;copy:Record<string,string>;styles:Partial<Record<string,IdentityElementStyle>>;background:string;foreground:string;inputBackground:string;inputBorder:string;padding:number;radius:number;gap:number;buttonBackground:string;buttonColor:string};
 i18n?:{defaultLocale:string;supportedLocales:readonly string[];messages:Partial<Record<string,Record<string,string>>>};
}
export interface IdentityProject {name:string;pages:Record<string,IdentityPage>;navigation?:{id:string;parent?:string;labels:Record<string,string>}[]}
export interface IdentityScreenContext {screen:string;page:IdentityPage;locale:string;onNavigate:(screen:string)=>void}
export interface IdentityScreenProps {
 screen?:string;initialScreen?:string;locale?:string;
 /** Native data, forms and authenticated operations belong to the host application. */
 renderNative:(context:IdentityScreenContext)=>ReactNode;
 onNavigate?:(screen:string)=>void;
}
function elementStyle(style:IdentityElementStyle={}):CSSProperties {
 return {color:style.color,background:style.background,fontSize:style.fontSize,fontWeight:style.fontWeight,padding:style.padding,marginBlock:style.margin,borderRadius:style.radius,textAlign:style.align,lineHeight:style.lineHeight};
}
function translated(source:IdentityPage,language?:string){
 const settings=source.i18n,requested=(language||settings?.defaultLocale||'fr').replaceAll('_','-').toLowerCase();
 const locale=settings?.supportedLocales.find(value=>value.toLowerCase()===requested)||settings?.supportedLocales.find(value=>value.toLowerCase().split('-')[0]===requested.split('-')[0])||settings?.defaultLocale||'fr';
 const messages=locale===settings?.defaultLocale?{}:settings?.messages[locale]||{};
 const read=(key:string,value:string)=>messages[key]??value;
 const page={...source,brand:{...source.brand,name:read('brand.name',source.brand.name),alt:read('brand.alt',source.brand.alt)},native:{...source.native,copy:Object.fromEntries(Object.entries(source.native.copy).map(([key,value])=>[key,read('native.'+key,value)]))},blocks:source.blocks.map(block=>({...block,text:read(`blocks.${block.id}.text`,block.text),alt:read(`blocks.${block.id}.alt`,block.alt)}))};
 return {page,locale};
}

/** Bind an exported, validated composition to the host's authenticated content. */
export function createIdentityTheme(project:IdentityProject,frameCss='',variablesForPage:(page:IdentityPage)=>Record<string,string>=()=>({})){
 const screens=Object.keys(project.pages).filter(id=>/^(account:[0-4]|admin:[0-5]|welcome:0)$/.test(id));
 if(!screens.length)throw Error('The project contains no application screen.');
 function IdentityScreen({screen,initialScreen,locale,renderNative,onNavigate}:IdentityScreenProps){
  const [selected,setSelected]=useState(initialScreen||screens[0]);const current=screen||selected;
  if(!screens.includes(current))throw Error('Unknown application screen: '+current);
  const {page,locale:language}=translated(project.pages[current],locale),a=page.appearance,n=page.native;
  const navigate=(id:string)=>{if(!screens.includes(id))throw Error('Unknown application screen: '+id);if(!screen)setSelected(id);onNavigate?.(id);};
  const context:IdentityScreenContext={screen:current,page,locale:language,onNavigate:navigate};
  function zone(name:string){return <div className={'identity-zone identity-'+name} data-hanko-slot={name}>{page.blocks.filter(block=>block.zone===name).map(block=>{
   const style={textAlign:block.align,whiteSpace:'pre-wrap',overflowWrap:'anywhere',...elementStyle(block.style)} as CSSProperties;
   const align=block.style?.align||block.align;
   const frame:CSSProperties={width:block.style?.width?block.style.width+'%':undefined,marginInline:align==='center'?'auto':align==='right'?'auto 0':undefined};
   const wrap=(content:ReactNode)=><div className="identity-block" data-block={block.id} key={block.id} style={frame}>{content}</div>;
   if(block.type==='image')return wrap(<img src={block.src} alt={block.alt} style={{display:'block',maxWidth:'100%',height:block.style?.imageHeight,maxHeight:block.style?.imageHeight||240,objectFit:block.style?.fit||'contain',borderRadius:block.style?.radius??page.radius,...style}}/>);
   if(block.type==='divider')return wrap(<hr style={{border:0,height:block.style?.imageHeight||1,background:block.style?.color||page.accent,marginBlock:12,...elementStyle(block.style)}}/>);
   if(block.type==='button'){
    const fragment=block.href?.startsWith('#')?block.href.slice(1):undefined;
    const destination=fragment?.replace(/^(account|admin|welcome)-(\d+)$/,'$1:$2');
    const actionStyle={display:'inline-block',border:0,background:page.accent,color:n.buttonColor,padding:'10px 16px',borderRadius:page.radius,font:'inherit',...style};
    return wrap(destination&&screens.includes(destination)?<button type="button" style={actionStyle} onClick={()=>navigate(destination)}>{block.text}</button>:<a href={block.href} style={actionStyle}>{block.text}</a>);
   }
   return wrap(block.type==='heading'?<h2 style={{fontFamily:page.appearance.headingFont||page.appearance.font,fontSize:36,fontWeight:600,lineHeight:1.15,margin:0,...style}}>{block.text}</h2>:<p style={{margin:0,fontSize:13,lineHeight:1.65,...style}}>{block.text}</p>);
  })}</div>;}
  const family=current.split(':')[0];
  const navigation:NonNullable<IdentityProject['navigation']>=project.navigation||screens.map(id=>({id,labels:{}}));
  const familyNodes=navigation.filter(node=>node.id.split(':')[0]===family);
  const primary=familyNodes.filter(node=>!node.parent||family==='admin'&&node.parent==='admin:0');
  let active=current;const visited=new Set<string>();
  while(!primary.some(node=>node.id===active)&&!visited.has(active)){visited.add(active);const parent=familyNodes.find(node=>node.id===active)?.parent;if(!parent)break;active=parent;}
  const secondary=familyNodes.filter(node=>node.parent===active&&!primary.some(root=>root.id===node.id));
  const label=(node:typeof navigation[number])=>node.labels[language]||node.labels[language.split('-')[0]]||translated(project.pages[node.id],language).page.native.copy.title;
  return <div className="hanko-identity-composition" data-screen={current} lang={language} dir={['ar','he','fa','ur'].includes(language.split('-')[0])?'rtl':'ltr'} style={{...variablesForPage(page),minHeight:'100%',boxSizing:'border-box',background:a.background,color:a.foreground,fontFamily:a.font,padding:a.padding,backgroundImage:a.backgroundImage?`url(${JSON.stringify(a.backgroundImage)})`:undefined,backgroundSize:a.backgroundFit,backgroundPosition:'center','--identity-gap':a.gap+'px'} as CSSProperties}>
   <style>{identityCss}{frameCss}</style><div data-hanko-frame={a.composition} data-hanko-family={family} style={{maxWidth:a.contentWidth,marginInline:'auto'}}>
    <div className="identity-brand" data-hanko-slot="brand" style={{justifyContent:page.brand.align==='center'?'center':page.brand.align==='right'?'flex-end':'flex-start',color:page.brand.color,fontSize:page.brand.fontSize}}>{page.brand.logo?<img src={page.brand.logo} alt={page.brand.alt} style={{height:page.brand.size,maxWidth:180,objectFit:'contain'}}/>:page.brand.mark?<span style={{display:'grid',placeItems:'center',width:page.brand.size,height:page.brand.size,borderRadius:6,background:page.accent,color:n.buttonColor}}>{page.brand.mark}</span>:null}<strong>{page.brand.name}</strong></div>
    {(primary.length>1||secondary.length>0)&&<nav className="identity-navigation" data-hanko-slot="nav" aria-label={language==='fr'?'Navigation de l’application':'Application navigation'}>{primary.map(node=><button type="button" key={node.id} aria-current={node.id===current?'page':node.id===active?'location':undefined} onClick={()=>navigate(node.id)}>{label(node)}</button>)}</nav>}
    {secondary.length>0&&<nav className="identity-navigation identity-subpages" data-hanko-slot="subnav" aria-label={language==='fr'?'Sous-pages':'Subpages'}>{secondary.map(node=><button type="button" key={node.id} aria-current={node.id===current?'page':undefined} onClick={()=>navigate(node.id)}>{label(node)}</button>)}</nav>}
    {zone('header')}<div className="identity-body" data-hanko-slot="body" data-layout={page.layout}>{zone('aside')}<section className="identity-native" data-hanko-slot="form" data-hanko-field={n.fieldStyle} data-hanko-action={n.actionSize} style={{background:n.background,color:n.foreground,padding:n.padding,borderRadius:n.radius,gap:n.gap}}>
     <h1 style={{fontFamily:a.headingFont||a.font,fontSize:20,lineHeight:1.25,margin:0,...elementStyle(n.styles.title)}}>{n.copy.title}</h1>
     {n.copy.description&&<p style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',...elementStyle(n.styles.description)}}>{n.copy.description}</p>}
     {renderNative(context)}
    </section></div>{zone('footer')}
   </div></div>;
 }
 const screen=(id:string)=>(props:Omit<IdentityScreenProps,'screen'|'initialScreen'>)=><IdentityScreen {...props} initialScreen={id}/>;
 return {IdentityScreen,applicationScreenIds:screens,ProfileScreen:screen('account:0'),SecurityScreen:screen('account:1'),PasswordScreen:screen('account:2'),AuthenticatorScreen:screen('account:3'),SessionsScreen:screen('account:4'),AdministrationScreen:screen('admin:0'),UsersScreen:screen('admin:1'),UserScreen:screen('admin:2'),ClientsScreen:screen('admin:3'),ClientScreen:screen('admin:4'),PermissionsScreen:screen('admin:5'),WelcomeScreen:screen('welcome:0')};
}

export function IdentityInput({context,part,value,onChange,...props}:{context:IdentityScreenContext;part:'name'|'email'|'username'|'password'|'otp';value:string;onChange:InputHTMLAttributes<HTMLInputElement>['onChange']}&Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'>){
 const id=useId(),n=context.page.native,label=part+'Label',example=part+'Example';
 return <div className="identity-field"><label htmlFor={id} style={{fontSize:13,...elementStyle(n.styles[label])}}>{n.copy[label]}</label><input {...props} id={id} value={value} onChange={onChange} placeholder={props.placeholder??n.copy[example]} type={props.type??(part==='password'?'password':part==='email'?'email':'text')} style={{boxSizing:'border-box',width:'100%',font:'inherit',padding:'10px 12px',border:'1px solid '+n.inputBorder,borderWidth:n.fieldStyle==='underline'||n.fieldStyle==='filled'?'0 0 1px':undefined,borderRadius:context.page.radius,background:n.inputBackground,color:n.foreground,...elementStyle(n.styles[example]),...props.style}}/></div>;
}
export function IdentityButton({context,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{context:IdentityScreenContext}){
 const n=context.page.native;return <button {...props} type={props.type||'button'} style={{font:'inherit',border:0,padding:'10px 16px',borderRadius:context.page.radius,background:n.buttonBackground,color:n.buttonColor,...elementStyle(n.styles.action),...props.style}}>{children??n.copy.action}</button>;
}
const identityCss=`.hanko-identity-composition *{box-sizing:border-box}.hanko-identity-composition .identity-brand{display:flex;align-items:center;gap:8px;margin-bottom:24px}.hanko-identity-composition .identity-navigation{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}.hanko-identity-composition .identity-navigation button{font:inherit;color:inherit;border:0;background:transparent;padding:6px;cursor:pointer}.hanko-identity-composition .identity-navigation [aria-current=page]{font-weight:700;text-decoration:underline}.hanko-identity-composition .identity-body{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1fr);gap:var(--identity-gap);align-items:center;margin:16px 0 20px}.hanko-identity-composition .identity-body[data-layout=right] .identity-aside{order:2}.hanko-identity-composition .identity-body[data-layout=center]{display:flex;flex-direction:column;align-items:stretch}.hanko-identity-composition .identity-body[data-layout=center] .identity-native{width:100%;max-width:560px;margin-inline:auto}.hanko-identity-composition .identity-native{display:flex;flex-direction:column;min-width:0}.hanko-identity-composition .identity-zone{min-width:0;display:grid;gap:10px}.hanko-identity-composition .identity-field{display:grid;gap:6px}.hanko-identity-composition a{overflow-wrap:anywhere}@media(max-width:640px){.hanko-identity-composition .identity-body{display:flex;flex-direction:column;align-items:stretch}.hanko-identity-composition .identity-body .identity-aside{order:0!important}.hanko-identity-composition .identity-native{width:100%}}`;
