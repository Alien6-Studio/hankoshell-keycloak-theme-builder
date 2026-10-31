import {useUi} from './interface-context';
import {activePrimary,navigationScreen,primaryScreens,rootScreens,type NavigationScreen} from './navigation';
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Eye, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { InlineText } from './inline-text';
import { families, nativePartNames, type Family, type NativePart, type Page } from './model';
import { journeyScreens, journeyText, screenAt, screenLabel, type ScreenLink } from './journeys';
import type { Locale } from './i18n';
import { createAuthenticatorSecret, verifyAuthenticatorCode } from './authenticator';
import { AuthenticatorSetup } from './authenticator-setup';

export type DemoState = {
  profile?: { name: string; email: string };
  mfa: boolean;
  authenticatorSecret: string;
  closedSessions: number[];
  users: { id: string; name: string; email: string }[];
  clients: { id: string; name: string; clientId: string; redirect: string }[];
};
export function createDemoState(): DemoState {
  return { mfa: false, authenticatorSecret: createAuthenticatorSecret(), closedSessions: [], users: [
    { id: 'camille', name: 'Camille Martin', email: 'camille@aurora.fr' },
    { id: 'alex', name: 'Alex Bernard', email: 'alex@aurora.fr' },
    { id: 'sarah', name: 'Sarah Cohen', email: 'sarah@aurora.fr' },
  ], clients: [
    { id: 'dashboard', name: 'Aurora Dashboard', clientId: 'aurora-dashboard', redirect: 'https://app.aurora.example/callback' },
    { id: 'portal', name: 'Aurora Portal', clientId: 'aurora-portal', redirect: 'https://portal.aurora.example/callback' },
  ] };
}
export type Navigate = (target: string, entity?: string) => void;
export function DestinationHint({ link, onNavigate }: { link: ScreenLink; onNavigate: Navigate }) {
  const ui=useUi();
  return <div className="destination-hint"><span>{link.target ? <>{ui("Ouvre ")}<strong>{ui(screenLabel(link.target))}</strong></> : link.result}</span>{link.target && <button type="button" onClick={e => { e.stopPropagation(); onNavigate(link.target!); }} aria-label={ui('View {screen}',{screen:ui(screenLabel(link.target))})}><Eye size={13} />{ui("Voir")}</button>}</div>;
}

export function JourneyMap({ family, index, onNavigate, testing, onEdit }: { family: Family; index: string; onNavigate: Navigate; testing: boolean; onEdit: () => void }) {
  const ui=useUi();
  const screen = screenAt(family, index);
  return <aside className="inspector journey-inspector" aria-label={ui("Parcours de cet écran")}><div className="inspector-heading"><h2>{testing ? ui('Parcours interactif') : 'Destinations'}</h2></div><div className="journey-inspector-body"><span className="eyebrow">{ui("Vous êtes ici")}</span><strong>{ui(families[family].label)} {ui(" / ")}{ui(families[family].pages[Number(index)])}</strong><p className="secondary">{testing ? ui('Cliquez sur les actions de l’écran pour parcourir leurs destinations. Les formulaires utilisent des données d’exemple.') : ui('Chaque action indique l’écran qu’elle ouvre.')}</p><span className="eyebrow">{ui("Actions de cet écran")}</span>{screen?.links.map(link => <div className="journey-map-action" key={link.part}><span>{link.label}</span><DestinationHint link={link} onNavigate={onNavigate} /></div>)}{!screen && <p className="secondary">{ui("Les actions sont simulées dans cet aperçu.")}</p>}<Button variant="outline" className="full-width" onClick={onEdit}>{ui("Modifier cet écran")}</Button><p className="secondary journey-data-note">{ui("Session de démonstration. Les données saisies pendant le test restent séparées du projet de thème.")}</p></div></aside>;
}

export function JourneyLibrary({ family, index, onNavigate }: { family: Family; index: string; onNavigate: Navigate }) {
  const ui=useUi();
  const [expanded,setExpanded] = useState(false);
  const tree=(nodes:NavigationScreen[]):React.ReactNode=><ul className="journey-tree">{nodes.map(node=><li key={node.id}><Button variant="ghost" aria-current={family===node.family&&index===String(node.index)?'page':undefined} onClick={()=>{onNavigate(node.id);setExpanded(false);}}><span>{ui(node.label)}</span><ChevronRight size={13}/></Button>{node.children.length>0&&tree(node.children.map(id=>navigationScreen(id)!))}</li>)}</ul>;
  return <aside className="library journey-library" data-expanded={expanded} aria-label={ui("Plan du parcours")}><div className="journey-library-heading"><h2>{ui("Écrans du thème")}</h2><Button variant="ghost" size="sm" className="journey-plan-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?ui('Masquer le plan'):ui('Afficher le plan')}</Button></div><p className="secondary">{ui("Choisissez une famille, puis un écran dans son arborescence.")}</p>{Object.entries(families).map(([f,definition])=><details className="journey-family" key={f} open={family===f}><summary>{ui(definition.label)}</summary>{tree(rootScreens(f as Family))}</details>)}</aside>;
}

export function ApplicationNavigation({ family, index, locale, onNavigate }: { family: Family; index: string; locale: Locale; onNavigate: Navigate }) {
  const entries = family==='account'||family==='admin'?primaryScreens(family).map(node=>node.id):[];
  const activeKey=activePrimary(`${family}:${index}`)?.id;
  if (!entries.length) return null;
  return <nav className="application-nav" data-hanko-slot="nav" aria-label="Navigation de l’application">{entries.map(key => {
    const screen = journeyScreens[key];
    const active = key === activeKey;
    return <button type="button" key={key} aria-current={active ? 'page' : undefined} onClick={e => { e.stopPropagation(); onNavigate(key); }}>{journeyText(screen.label,locale)}</button>;
  })}</nav>;
}

export function JourneyScreen({ page, family, index, locale, testing, selected, onSelect, onChange, onNavigate, demo, onDemo, entity }: {
  page: Page; family: Family; index: string; locale: Locale; testing: boolean; selected: string | null;
  onSelect: (part: NativePart | null) => void; onChange: (part: NativePart, value: string) => void; onNavigate: Navigate;
  demo: DemoState; onDemo: (next: DemoState) => void; entity?: string;
}) {
  const ui=useUi();
  const instance=useId();
  const screen = screenAt(family,index);
  const kind = screen?.kind;
  const t = (value: string) => journeyText(value,locale);
  const user = demo.users.find(item => item.id === entity) || demo.users[0];
  const client = demo.clients.find(item => item.id === entity) || demo.clients[0];
  const [values,setValues] = useState<Record<string,string>>(() => ({
    name: kind === 'user' && entity ? user.name : kind === 'client' && entity ? client.name : kind === 'profile' && demo.profile ? demo.profile.name : page.native.copy.nameExample,
    email: kind === 'user' && entity ? user.email : kind === 'client' && entity ? client.redirect : kind === 'profile' && demo.profile ? demo.profile.email : page.native.copy.emailExample,
    username: kind === 'client' && entity ? client.clientId : '', password: '', otp: '',
  }));
  const [query,setQuery] = useState('');
  const [feedback,setFeedback] = useState('');
  const [error,setError] = useState('');
  const [confirmation,setConfirmation] = useState<number | null>(null);
  const [role,setRole] = useState<number | null>(null);
  const style = (part: NativePart): CSSProperties => {
    const s = page.native.styles[part] || {};
    return Object.fromEntries(Object.entries({ color:s.color, background:s.background, fontSize:s.fontSize, fontWeight:s.fontWeight, padding:s.padding, marginBlock:s.margin, borderRadius:s.radius, textAlign:s.align, lineHeight:s.lineHeight }).filter(([,value]) => value !== undefined));
  };
  const text = (part: NativePart, className = '', multiline = true, inheritStyle = false) => <InlineText value={page.native.copy[part]} label={ui('Edit {label}',{label:ui(nativePartNames[part])})} className={className} style={inheritStyle?undefined:style(part)} multiline={multiline} onSelect={() => onSelect(part)} onChange={value => onChange(part,value)} />;
  function field(name: 'username' | 'password' | 'email' | 'name' | 'otp', type = 'text') {
    const label = `${name}Label` as NativePart, example = `${name}Example` as NativePart;
    const password = type === 'password';
    const id = `journey-${family}-${index}-${instance}-${name}`;
    return <div className="native-field" key={name}><label htmlFor={id}>{text(label,'native-label',false)}</label><Input id={id} aria-label={testing ? page.native.copy[label] : ui('Preview {label}',{label:page.native.copy[label]})} dir={password || name === 'email' || name === 'username' || name === 'otp' ? 'ltr' : undefined} readOnly={!testing} value={testing ? values[name] || '' : ''} placeholder={page.native.copy[example]} type={testing ? type : 'text'} autoComplete={name === 'otp'?'one-time-code':'off'} required={testing} pattern={testing && name === 'otp' ? '[0-9]{6}' : undefined} inputMode={name === 'otp' ? 'numeric' : undefined} maxLength={name === 'otp'?6:undefined} style={{ background:page.native.inputBackground, color:page.native.foreground,borderWidth:page.native.fieldStyle==='underline'?'0 0 1px':page.native.fieldStyle==='filled'?'0 0 1px':undefined,borderColor:page.native.inputBorder, ...style(example) }} onChange={e => setValues(p => ({...p,[name]:name === 'otp'?e.target.value.replace(/[^0-9]/g,'').slice(0,6):e.target.value}))} onPaste={event=>{if(name === 'otp' && testing) {event.preventDefault();const value=event.clipboardData.getData('text/plain').replace(/[^0-9]/g,'').slice(0,6);setValues(p=>({...p,otp:value}));}}} onClick={e => { e.stopPropagation(); if (!testing) onSelect(example); }} /></div>;
  }
  function primary() {
    const styles = { background:page.native.buttonBackground, color:page.native.buttonColor, ...style('action') };
    return testing ? <button type="submit" className="native-action" style={styles} disabled={kind === 'mfa' && demo.mfa}>{text('action','',false,true)}<ArrowRight size={15}/></button> : <div className="native-action" data-native-action style={styles} onClick={e => { e.stopPropagation(); onSelect('action'); }}>{text('action','',false,true)}<ArrowRight size={15}/></div>;
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (kind === 'password' && values.password !== values.email) { setError(t('Les deux mots de passe doivent être identiques.')); return; }
    if (kind === 'profile') onDemo({...demo,profile:{name:values.name,email:values.email}});
    if (kind === 'user') onDemo({...demo,users:demo.users.map(item => item.id === user.id ? {...item,name:values.name,email:values.email} : item)});
    if (kind === 'client') onDemo({...demo,clients:demo.clients.map(item => item.id === client.id ? {...item,name:values.name,clientId:values.username,redirect:values.email} : item)});
    if (kind === 'mfa') {
      if (demo.mfa) return;
      if (!verifyAuthenticatorCode(demo.authenticatorSecret,values.otp)) {setError(t('Code incorrect ou expiré. Saisissez le code actuel de votre application.'));return;}
      onDemo({...demo,mfa:true});
    }
    if (family === 'login') { onNavigate('account:0'); return; }
    if (family === 'email') { onNavigate('login:0'); return; }
    setFeedback(t(kind === 'mfa' ? 'Double authentification activée dans cet aperçu.' : 'Modifications enregistrées dans cet aperçu.'));
    if (kind === 'password') setValues(p => ({...p,password:'',username:'',email:''}));
  }
  function linkRow(part: 'row0' | 'row1' | 'row2', link: ScreenLink, action?: NativePart) {
    const label = action || part;
    return <div className={kind === 'security' ? 'security-row' : 'native-row-wrap'} key={part}>
      {action && <div>{text(part,'',false)}{testing && kind === 'security' && part === 'row1' && demo.mfa && <small className="journey-badge">{t('Activée')}</small>}</div>}
      {testing ? <button type="button" className={kind === 'security' ? 'security-action' : 'native-row'} title={link.target ? screenLabel(link.target) : link.result} onClick={() => link.target ? onNavigate(link.target) : undefined}>{text(label,'',false)}<ArrowRight size={14}/></button> : <><div className={kind === 'security' ? 'security-action' : 'native-row'} onClick={e => {e.stopPropagation();onSelect(label);}}>{text(label,'',false)}<ArrowRight size={14}/></div><DestinationHint link={link} onNavigate={onNavigate}/></>}
    </div>;
  }
  const hasForm = ['profile','password','mfa','user','client'].includes(kind || '') || family === 'login' || family === 'email';
  return <section className={`native-card journey-native kind-${kind || family}`} data-hanko-slot="form" data-hanko-field={page.native.fieldStyle} data-hanko-action={page.native.actionSize} data-selected={!testing && selected?.startsWith('@native')} aria-label={ui('Protected Keycloak functions')} style={{ background:page.native.background,color:page.native.foreground,padding:page.native.padding,borderRadius:page.native.radius,'--page-fg':page.native.foreground,'--page-surface':page.native.background,'--primary':page.native.buttonBackground,'--primary-action':page.native.buttonBackground,'--border':page.native.inputBorder,'--page-muted':page.native.styles.description?.color||page.appearance.muted,'--field-gap':page.native.gap+'px' } as CSSProperties} onClick={e => {e.stopPropagation();if(!testing) onSelect(null);}}>
    {!testing && <button type="button" className="native-lock" aria-label={ui('Form · editable appearance: customize')} onClick={e => {e.stopPropagation();onSelect(null);}}><LockKeyhole size={12}/>{ui('Form · editable appearance')}</button>}
    {screen?.parent && <button type="button" className="journey-back" onClick={() => onNavigate(screen.parent!)}><ArrowLeft size={13}/>{t(journeyScreens[screen.parent].label)}</button>}
    <h2>{text('title')}</h2><p className="native-description">{text('description')}</p>
    {kind === 'security' && screen!.links.map((link,i) => linkRow(`row${i}` as 'row0'|'row1'|'row2',link,link.part))}
    {kind === 'overview' && <><div className="journey-stats">{screen!.links.map((link,i) => <button type="button" key={link.part} onClick={() => onNavigate(link.target!)}><strong>{[demo.users.length,demo.clients.length,3][i]}</strong><span>{t(link.label)}</span></button>)}</div>{screen!.links.map(link => linkRow(link.part as 'row0'|'row1'|'row2',link))}</>}
    {(kind === 'users' || kind === 'clients') && <div className="journey-table">
      <div className="native-field"><label htmlFor="journey-search">{text('usernameLabel','native-label',false)}</label><Input id="journey-search" readOnly={!testing} value={query} placeholder={page.native.copy.usernameExample} onChange={e => setQuery(e.target.value)} onClick={e => {e.stopPropagation();if(!testing) onSelect('usernameExample');}} style={{background:page.native.inputBackground,borderColor:page.native.inputBorder}}/></div>
      <div className="journey-table-head">{(['row0','row1','row2'] as const).map(part => <span key={part}>{text(part,'',false)}</span>)}</div>
      {(kind === 'users' ? demo.users : demo.clients).filter(item => Object.values(item).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item => <button className="journey-table-row" type="button" key={item.id} onClick={e => {e.stopPropagation();if(testing) onNavigate(kind === 'users' ? 'admin:2' : 'admin:4',item.id);else onSelect('action');}} title={screenLabel(kind === 'users' ? 'admin:2' : 'admin:4')}><span><strong>{item.name}</strong><small>{testing ? page.native.copy.action : t('Données d’exemple')}</small></span><span>{'email' in item ? item.email : item.clientId}</span><span>{'email' in item ? <span className="journey-badge">{t('Actif')}</span> : 'OIDC'}<ChevronRight size={14}/></span></button>)}
      {!(kind === 'users' ? demo.users : demo.clients).some(item => Object.values(item).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())) && <p className="journey-empty">{t('Aucun résultat.')}</p>}
      {!testing && <><div className="journey-table-action">{text('action','',false)}</div><DestinationHint link={screen!.links[0]} onNavigate={onNavigate}/></>}
    </div>}
    {kind === 'sessions' && <div className="journey-sessions">{([0,1,2] as const).filter(i => !demo.closedSessions.includes(i)).map(i => <div className="journey-session" key={i}><div><Smartphone size={18}/><span>{text(`row${i}`,'',false)}<small>{t(i === 0 ? 'Connecté maintenant' : 'Dernière activité : aujourd’hui')}</small></span></div>{testing ? <button type="button" disabled={i === 0} onClick={() => setConfirmation(i)}>{text(`row${i}Action`,'',false)}</button> : <div onClick={e => {e.stopPropagation();onSelect(`row${i}Action`);}}>{text(`row${i}Action`,'',false)}</div>}{confirmation === i && <div className="journey-confirmation"><p>{t('Terminer cette session ?')}</p><Button variant="outline" size="sm" onClick={() => setConfirmation(null)}>{t('Annuler')}</Button><Button size="sm" onClick={() => {onDemo({...demo,closedSessions:[...demo.closedSessions,i]});setConfirmation(null);setFeedback(t('Session terminée dans cet aperçu.'));}}>{t('Confirmer')}</Button></div>}</div>)}</div>}
    {kind === 'permissions' && <div className="journey-roles">{([0,1,2] as const).map(i => <div className="journey-role" key={i}><div><ShieldCheck size={17}/><strong>{text(`row${i}`,'',false)}</strong></div>{testing ? <button type="button" aria-expanded={role === i} onClick={() => setRole(role === i ? null : i)}>{text(`row${i}Action`,'',false)}<ChevronRight size={14}/></button> : <div onClick={e => {e.stopPropagation();onSelect(`row${i}Action`);}}>{text(`row${i}Action`,'',false)}</div>}{role === i && <ul className="permission-list">{[['users:read','users:write','clients:read','roles:read'],['profile:read','profile:write','resources:read'],['profile:read','resources:read']][i].map(permission => <li key={permission}><CheckCircle2 size={13}/><code>{permission}</code></li>)}</ul>}</div>)}</div>}
    {hasForm && <form onSubmit={submit}>
      {kind === 'mfa' && <div className="mfa-steps"><ol>{(['row0','row1','row2'] as const).map(part => <li key={part}>{text(part)}</li>)}</ol><AuthenticatorSetup secret={demo.authenticatorSecret} brand={page.brand.name} account={demo.profile?.email || demo.users[0].email} locale={locale}/></div>}
      {kind === 'profile' || kind === 'user' ? <>{field('name')}{field('email','email')}</> : kind === 'password' ? <>{field('username','password')}{field('password','password')}{field('email','password')}</> : kind === 'mfa' ? field('otp') : kind === 'client' ? <>{field('username')}{field('name')}{field('email','url')}</> : family === 'login' ? index === '2' ? field('otp') : <>{index==='1'&&field('name')}{field('username','email')}{field('password','password')}</> : null}
      {primary()}
      {!testing && screen?.links.find(link => link.part === 'action') && <DestinationHint link={screen.links.find(link => link.part === 'action')!} onNavigate={onNavigate}/>}
    </form>}
    {kind === 'user' && <div className="journey-user-access">{linkRow('row0',screen!.links[1],'row0Action')}</div>}
    {!kind && family === 'welcome' && <button type="button" className="native-action" onClick={() => onNavigate('login:0')}>{t('Se connecter')}<ArrowRight size={14}/></button>}
    {error && <p className="journey-error" role="alert">{error}</p>}
    {feedback && <div className="journey-feedback" role="status"><CheckCircle2 size={17}/>{feedback}</div>}
    {testing && kind === 'mfa' && demo.mfa && !feedback && <div className="journey-feedback" role="status"><CheckCircle2 size={17}/>{t('Double authentification activée dans cet aperçu.')}</div>}
    {testing && screen?.parent && feedback && <Button variant="outline" className="journey-return" onClick={() => onNavigate(screen.parent!)}>{t('Retour')} · {t(journeyScreens[screen.parent].label)}</Button>}
  </section>;
}
