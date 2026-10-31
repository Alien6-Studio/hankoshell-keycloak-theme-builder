import {useUi} from './interface-context';
import {uiMessage,type UiMessage} from './interface-locale';
import {requireValidDocument} from './contract-client';
import {useStudioHost,useContractBase} from './host';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Download, Eye, Languages, RotateCcw, Search, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Choice } from './controls';
import { families, type Page } from './model';
import { languages, locales, type Locale } from './i18n';
import { exportTranslations, importTranslations, pageName, translationEntries, translationMaxLength, translationState, variableDifference, writeTranslation, type TranslationBundle, type TranslationState } from './translations';

const statusNames: Record<TranslationState,string> = {source:'Langue source',shared:'Nom partagé',empty:'Source vide',missing:'Manquant',prefilled:'À relire',translated:'Traduit',invalid:'Variables à vérifier',inactive:'Langue inactive'};
const pageSize = 16;
export function TranslationWorkspace({ pages, name, initialPage, initialLocale, onChanges, onAdd, onView, onClose }: {
  pages: Record<string,Page>; name: string; initialPage: string; initialLocale: Locale;
  onChanges: (changes: Record<string,Page>,message: UiMessage) => void; onAdd: (key: string) => void;
  onView: (page: string,locale: Locale,key?: string) => void; onClose: () => void;
}) {
  const ui=useUi();
  const contractBase=useContractBase();
  const Workspace=useStudioHost().embedded?'section':'main';
  const initial = pages[initialPage].i18n!;
  const latestPages=useRef(pages);latestPages.current=pages;
  const [locale,setLocale] = useState<Locale>(initialLocale !== initial.defaultLocale ? initialLocale : initial.supportedLocales.find(value => value !== initial.defaultLocale) || initialLocale);
  const [scope,setScope] = useState(initialPage);
  useEffect(() => {if(scope !== 'all' && !Object.hasOwn(pages,scope)) {setScope(initialPage);setPageNumber(0);}},[pages,scope,initialPage]);
  const [query,setQuery] = useState('');
  const [status,setStatus] = useState('all');
  const [editingSource,setEditingSource] = useState(false);
  const [focused,setFocused] = useState<string | null>(null);
  const [pageNumber,setPageNumber] = useState(0);
  const [message,setMessage] = useState('Les modifications sont appliquées au projet. Exportez le projet ou la langue pour conserver votre travail.');
  const [failed,setFailed] = useState(false);
  const [busy,setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const orderedPages = useMemo(() => Object.keys(pages).sort((a,b) => {
    const [af,ai] = a.split(':'),[bf,bi] = b.split(':');
    return Object.keys(families).indexOf(af)-Object.keys(families).indexOf(bf) || Number(ai)-Number(bi);
  }),[pages]);
  const scopedPages = scope === 'all' ? orderedPages : orderedPages.filter(key => key === scope);
  const rows = useMemo(() => orderedPages.flatMap(pageKey => translationEntries(pages[pageKey],pageKey,ui).map(entry => ({...entry,pageKey,id:pageKey+'|'+entry.key}))),[pages,orderedPages,ui]);
  const scopedRows = rows.filter(row => scope === 'all' || row.pageKey === scope);
  const matches = scopedRows.filter(row => {
    const state = translationState(pages[row.pageKey],row,locale);
    const target = pages[row.pageKey].i18n!.messages[locale]?.[row.key] || '';
    return (status === 'all' || state === status || focused === row.id) && (!query.trim() || [row.label,row.source,target,pageName(row.pageKey,ui),row.key].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  });
  const currentNumber = Math.min(pageNumber,Math.max(0,Math.ceil(matches.length/pageSize)-1));
  const visibleRows = matches.slice(currentNumber*pageSize,(currentNumber+1)*pageSize);
  const inactivePages = scopedPages.filter(key => !pages[key].i18n!.supportedLocales.includes(locale));
  const availablePages = Object.entries(families).flatMap(([family,data]) => data.pages.map((_,index) => `${family}:${index}`)).filter(key => !Object.hasOwn(pages,key));
  const statistics = locales.map(language => {
    const states = scopedRows.filter(row => row.source.trim()).map(row => translationState(pages[row.pageKey],row,language));
    return {locale:language,total:states.length,ready:states.filter(state => ['source','shared','translated'].includes(state)).length,missing:states.filter(state => state === 'missing' || state === 'invalid' || state === 'inactive').length,review:states.filter(state => state === 'prefilled').length};
  });
  function edit(pageKey: string,key: string,language: Locale,value: string | undefined) {
    try {onChanges({[pageKey]:writeTranslation(pages[pageKey],key,language,value)},'Traduction mise à jour.');setFailed(false);setMessage('Modification appliquée. Elle sera incluse dans les exports du projet.');}
    catch(error) {setFailed(true);setMessage(error instanceof Error ? error.message : 'Modification impossible.');}
  }
  function enableLocale() {
    onChanges(Object.fromEntries(inactivePages.map(key => [key,{...pages[key],i18n:{...pages[key].i18n!,supportedLocales:[...pages[key].i18n!.supportedLocales,locale]}}])),uiMessage('Language {language} enabled on {count} screen(s).',{language:languages[locale].label,count:inactivePages.length}));
    setFailed(false);setMessage('Langue activée pour les écrans sélectionnés.');
  }
  function download() {
    const bundle = exportTranslations(Object.fromEntries(scopedPages.map(key => [key,pages[key]])),name,locale);
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));
    const link = document.createElement('a');link.href=url;link.download=`${name}-${locale}.translations.json`;link.click();URL.revokeObjectURL(url);
    setFailed(false);setMessage('Fichier de traduction exporté pour la langue et les écrans sélectionnés.');
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);setFailed(false);
    try {
      if (file.size > 2*1024*1024) throw new Error('Le fichier de traductions est limité à 2 Mo.');
      const document: unknown = JSON.parse(await file.text());
      await requireValidDocument(contractBase,'translations',document);
      const bundle = document as TranslationBundle;
      const changes = importTranslations(bundle,latestPages.current,name);
      if (Object.keys(changes).length) onChanges(changes,uiMessage('Translations imported on {count} screen(s).',{count:Object.keys(changes).length}));
      setLocale(bundle.locale);setPageNumber(0);setMessage(Object.keys(changes).length ? 'Traductions importées ensemble et enregistrées dans le projet.' : 'Ce fichier ne contient aucune traduction à importer.');
    } catch(error) {setFailed(true);setMessage(error instanceof Error ? error.message : 'Import impossible.');}
    finally {setBusy(false);if(fileInput.current) fileInput.current.value='';}
  }
  return <Workspace className="translation-workspace" aria-label={ui("Gestion des traductions")}>
    <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label={ui("Fichier de traductions")} onChange={event => {void upload(event.target.files?.[0]);}}/>
    <header className="translation-heading"><div><span className="eyebrow"><Languages size={15}/>{ui("Contenus multilingues")}</span><h1>{ui("Traductions")}</h1><p>{ui("Comparez les textes, complétez les langues et vérifiez le résultat dans chaque écran.")}</p></div><div className="translation-heading-actions"><Button variant="outline" size="sm" onClick={download}><Download size={15}/>{ui("Exporter la langue")}</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={15}/>{ui("Importer des traductions")}</Button><Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft size={15}/>{ui("Retour au Studio")}</Button></div></header>
    <div className="translation-language-grid" aria-label={ui("Avancement par langue")}>{statistics.map(item => <button type="button" key={item.locale} aria-pressed={locale === item.locale} onClick={() => {setLocale(item.locale);setPageNumber(0);}}><span><strong lang={item.locale} dir={languages[item.locale].direction}>{languages[item.locale].label}</strong>{locale === item.locale && <Check size={14}/>}</span><small>{item.ready}{ui("/")}{item.total} {ui(" textes prêts")}</small><div className="translation-progress"><span style={{width:(item.total ? item.ready/item.total*100 : 0)+'%'}}/></div><small>{[item.missing ? ui('{count} to complete',{count:item.missing}) : '',item.review ? ui('{count} to review',{count:item.review}) : ''].filter(Boolean).join(' · ') || ui('À jour')}</small></button>)}</div>
    <div className="translation-filters"><Choice id="translation-page" label={ui("Écrans")} value={scope} options={[{value:'all',label:ui('Tous les écrans du projet')},...orderedPages.map(value => ({value,label:ui(pageName(value,ui))}))]} onChange={value => {setScope(value);setPageNumber(0);}}/><Choice id="translation-locale" label={ui("Langue à maintenir")} value={locale} options={locales.map(value => ({value,label:languages[value].label}))} onChange={value => {setLocale(value as Locale);setPageNumber(0);}}/><Choice id="translation-state" label={ui("Afficher")} value={status} options={[{value:'all',label:ui('Tous les textes')},{value:'missing',label:ui('Manquants')},{value:'prefilled',label:ui('À relire')},{value:'translated',label:ui('Traduits')},{value:'invalid',label:ui('Variables à vérifier')},{value:'inactive',label:ui('Langue inactive')}]} onChange={value => {setStatus(value);setPageNumber(0);}}/><label className="field translation-search">{ui("Rechercher")}<div><Search size={15}/><Input aria-label={ui("Rechercher une traduction")} value={query} onChange={event => {setQuery(event.target.value);setPageNumber(0);}} placeholder={ui("Texte, libellé ou écran")}/>{query && <button type="button" aria-label={ui("Effacer la recherche")} onClick={() => setQuery('')}><X size={13}/></button>}</div></label></div>
    <div className="translation-toolbar"><span>{matches.length} {ui(" texte(s) · ")}{scopedPages.length} {ui(" écran(s)")}</span><Button variant={editingSource ? 'secondary' : 'outline'} size="sm" aria-pressed={editingSource} onClick={() => setEditingSource(!editingSource)}>{editingSource ? ui('Verrouiller la source') : ui('Modifier la source')}</Button>{availablePages.length > 0 && <Choice id="translation-add-page" label={ui("Ajouter un écran au projet")} value="none" options={[{value:'none',label:ui('Ajouter un écran au projet')},...availablePages.map(value => ({value,label:ui(pageName(value,ui))}))]} onChange={value => {if(value !== 'none') {onAdd(value);setScope(value);setPageNumber(0);}}}/>}</div>
    {inactivePages.length > 0 && <div className="translation-language-notice"><span>{languages[locale].label} {ui(" est inactive sur ")}{inactivePages.length} {ui(" écran(s) de cette sélection.")}</span><Button variant="outline" size="sm" onClick={enableLocale}>{ui("Activer sur ces écrans")}</Button></div>}
    <div className="translation-save-status" role={failed ? 'alert' : 'status'} data-failed={failed}>{failed ? <X size={15}/> : <CheckCircle2 size={15}/>}<span>{busy ? ui('Vérification du fichier…') : ui(message)}</span></div>
    <div className="translation-column-heading" aria-hidden="true"><span>{ui("Texte source")}</span><span>{languages[locale].label}</span></div>
    <div className="translation-rows">{visibleRows.map(row => {
      const page=pages[row.pageKey], settings=page.i18n!, state=translationState(page,row,locale);
      const isSource=locale === settings.defaultLocale, value=isSource ? row.source : settings.messages[locale]?.[row.key];
      const diff=value !== undefined ? variableDifference(row.source,value) : {missing:[],extra:[]};
      const label=ui(pageName(row.pageKey,ui))+' — '+ui(row.label);
      return <section className="translation-row" key={row.id} data-key={row.key} data-page={row.pageKey} data-state={state} aria-label={label}>
        <div className="translation-row-heading"><div><span>{ui(pageName(row.pageKey,ui))}</span><h2>{ui(row.label)}</h2></div><span className="translation-badge" data-state={state}>{ui(statusNames[state])}</span><Button variant="ghost" size="sm" onClick={() => onView(row.pageKey,state === 'inactive' ? settings.defaultLocale : locale,row.key)} aria-label={ui('View screen: {label}',{label})}><Eye size={14}/>{ui("Voir l’écran")}</Button></div>
        <div className="translation-comparison"><div><label htmlFor={'source-'+row.id}>{languages[settings.defaultLocale].label}<span>{ui("Source")}</span></label><Textarea id={'source-'+row.id} aria-label={ui('Source — {label}',{label})} lang={settings.defaultLocale} dir={languages[settings.defaultLocale].direction} readOnly={!editingSource} value={row.source} maxLength={translationMaxLength(row.key)} onFocus={() => setFocused(row.id)} onBlur={() => setFocused(null)} onChange={event => edit(row.pageKey,row.key,settings.defaultLocale,event.target.value)}/></div><div><label htmlFor={'target-'+row.id} lang={locale} dir={languages[locale].direction}>{languages[locale].label}<span>{isSource ? ui('Langue source') : ui('Traduction')}</span></label><Textarea id={'target-'+row.id} aria-label={languages[locale].label+' — '+label} lang={locale} dir={languages[locale].direction} readOnly={isSource && !editingSource} disabled={state === 'inactive'} value={value ?? ''} maxLength={translationMaxLength(row.key)} placeholder={state === 'shared' ? row.source : state === 'inactive' ? ui('Activez cette langue pour cet écran.') : isSource ? '' : ui('Traduction à saisir · le texte source est utilisé en repli.')} onFocus={() => setFocused(row.id)} onBlur={() => setFocused(null)} onChange={event => edit(row.pageKey,row.key,locale,event.target.value)}/></div></div>
        {(diff.missing.length > 0 || diff.extra.length > 0) && <p className="translation-variable-error" role="alert">{diff.missing.length > 0 && <>{ui("Variables manquantes : ")}{diff.missing.join(', ')}{ui(". ")}</>}{diff.extra.length > 0 && <>{ui("Variables ajoutées : ")}{diff.extra.join(', ')}{ui(".")}</>}</p>}
        {!isSource && state !== 'inactive' && <div className="translation-row-actions">{state === 'prefilled' && <Button variant="outline" size="sm" onClick={() => edit(row.pageKey,row.key,locale,value)}><Check size={13}/>{ui("Valider cette traduction")}</Button>}{value === undefined ? <Button variant="ghost" size="sm" onClick={() => edit(row.pageKey,row.key,locale,row.source)}>{ui("Reprendre le texte source")}</Button> : <Button variant="ghost" size="sm" onClick={() => edit(row.pageKey,row.key,locale,undefined)}><RotateCcw size={13}/>{ui("Utiliser le repli")}</Button>}{value === '' && <small>{ui("Traduction volontairement vide. « Utiliser le repli » rétablit le texte source.")}</small>}</div>}
      </section>;
    })}</div>
    {!matches.length && <div className="translation-empty"><CheckCircle2 size={28}/><h2>{ui("Aucun texte pour cette sélection")}</h2><p>{ui("Changez d’écran, de langue ou de filtre pour poursuivre.")}</p><Button variant="outline" onClick={() => {setStatus('all');setQuery('');}}>{ui("Afficher tous les textes")}</Button></div>}
    <footer className="translation-pagination"><span>{matches.length ? ui('{start}–{end} of {total}',{start:currentNumber*pageSize+1,end:Math.min((currentNumber+1)*pageSize,matches.length),total:matches.length}) : ui('0 texte')}</span><Button variant="outline" size="sm" disabled={!currentNumber} onClick={() => setPageNumber(currentNumber-1)}><ArrowLeft size={14}/>{ui("Précédent")}</Button><Button variant="outline" size="sm" disabled={(currentNumber+1)*pageSize >= matches.length} onClick={() => setPageNumber(currentNumber+1)}>{ui("Suivant")}<ArrowRight size={14}/></Button></footer>
    <p className="translation-footnote">{ui("Les textes préremplis proviennent du catalogue et peuvent être relus. Conservez les variables telles que ")}{'{{prénom}}'} {ui(" et ")}{'{0}'}{ui(". L’export contient la langue et les écrans sélectionnés ; l’import vérifie les textes source avant d’appliquer les changements.")}</p>
  </Workspace>;
}
