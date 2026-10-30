import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronRight, Copy, Download, GripVertical, ImagePlus, Languages, Layers, LayoutTemplate, LockKeyhole, Monitor, MousePointer2, Palette, PanelLeft, Pencil, Play, Plus, Redo2, Rocket, Smartphone, Trash2, Type, Undo2, UploadCloud } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { blockNames, families, initialPage, makeBlock, normalizePage, presets, sample, stylePage, zones } from './model';
import type { Asset, Block, BlockType, ElementStyle, Family, Page, Zone } from './model';
import { Choice } from './controls';
import { Inspector } from './inspector';
import { ScreenStyles } from './screen-styles';
import {PublicationWorkspace} from './publication-workspace';
import { InlineText, PreviewContext } from './inline-text';
import { inheritAppearance, journeyScreens } from './journeys';
import { ApplicationNavigation, createDemoState, JourneyLibrary, JourneyMap, JourneyScreen } from './journey-screen';
import { applicationSource } from './application-export';
import { JsonEditor } from './json-editor';
import { TranslationWorkspace } from './translation-workspace';
import { selectionForTranslation, translationEntries } from './translations';
import { initializeI18n, languages, localizePage, mergeLocalizedPage, promoteLocale, selectedMessage, translationCoverage, type Locale } from './i18n';
import catalogue from '../catalog/themes.json';
import {requireValidDocument} from './contract-client';
import {assertEditableProject} from './editable-project';
import {useStudioHost,useContractBase,type StudioProject} from './host';
import {ScreenNavigation,NavigationPlan} from './navigation-plan';
import type {StudioView} from './navigation';
import {TemplateGallery,themePages,type GalleryApply} from './template-gallery';
import {builtin} from './i18n';
import {Dialog} from 'radix-ui';
import {useStudioPortal} from './host';

const icons = { heading: Type, text: PanelLeft, image: ImagePlus, divider: Layers, button: MousePointer2 };
function elementStyle(s: ElementStyle = {}): React.CSSProperties { return Object.fromEntries(Object.entries({ color: s.color, background: s.background, fontSize: s.fontSize, fontWeight: s.fontWeight, padding: s.padding, marginBlock: s.margin, borderRadius: s.radius, textAlign: s.align, lineHeight: s.lineHeight }).filter(([,value]) => value !== undefined)); }
const transferType = 'application/x-theme-studio';

function hostColor(value:string,fallback:string){if(/^#[0-9a-f]{6}$/i.test(value))return value;if(typeof document==='undefined'||!CSS.supports('color',value))return fallback;const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const context=canvas.getContext('2d');if(!context)return fallback;context.fillStyle=value;context.fillRect(0,0,1,1);const pixel=context.getImageData(0,0,1,1).data;return '#'+[pixel[0],pixel[1],pixel[2]].map(channel=>channel.toString(16).padStart(2,'0')).join('');}
const flowNames = ['Composer', 'Vérifier', 'Construire', 'Déployer', 'Affecter'];
type Snapshot = {key:string;page:Page};
type HistoryItem = Snapshot & {others?:Snapshot[];project?:StudioProject};

export function Studio() {
  const host=useStudioHost();
  const Canvas=host.embedded?'section':'main';
  const portal=useStudioPortal();
  const [modelName,setModelName]=useState('');
  const [modelOpen,setModelOpen]=useState(false);
  const contractBase=useContractBase();
  const [saving,setSaving]=useState(false);
  const [applyingTemplate,setApplyingTemplate]=useState(false);
  const [family, setFamily] = useState<Family>((Object.keys(host.initialProject?.pages||{})[0]?.split(':')[0] as Family)||'login');
  const [pageIndex, setPageIndex] = useState(Object.keys(host.initialProject?.pages||{})[0]?.split(':')[1]||'0');
  const key = family + ':' + pageIndex;
  const [pages, setPages] = useState<Record<string,Page>>(()=>{if(host.initialProject)return Object.fromEntries(Object.entries(host.initialProject.pages).map(([key,value])=>{const[f,i]=key.split(':');return[key,normalizePage(structuredClone(value),f as Family,Number(i))];}));const p=initialPage('login');const b=host.initialBrand;if(b){if(b.name) p.brand.name=b.name;if(b.accent){const color=hostColor(b.accent,p.accent);p.accent=color;p.native.buttonBackground=color;}if(b.background){const color=hostColor(b.background,p.appearance.background);p.appearance.background=color;p.native.background=color;p.native.inputBackground=color;}if(b.foreground){const color=hostColor(b.foreground,p.appearance.foreground);p.appearance.foreground=color;p.brand.color=color;p.native.foreground=color;}if(b.font)p.appearance.font=b.font;}return {'login:0':p};});
  const sourcePage = normalizePage(pages[key], family, Number(pageIndex));
  const [locale, setLocale] = useState<Locale>(host.initialLocale==='en'?'en':'fr');
  const page = localizePage(sourcePage, locale);
  const coverage = translationCoverage(sourcePage, locale, translationEntries(sourcePage,key).map(entry => entry.key));
  const [selected, setSelected] = useState<string | null>(page.blocks[0]?.id||null);
  const [device, setDevice] = useState('desktop');
  const [tab, setTab] = useState('blocks');
  const [galleryOpen,setGalleryOpen]=useState(host.initialView==='gallery');
  const [media, setMedia] = useState<Asset[]>(host.initialProject?.media||[]);
  const [dragZone, setDragZone] = useState<string | null>(null);
  const [dragBlock, setDragBlock] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [plain, setPlain] = useState(false);
  const [testing, setTesting] = useState(false);
  const [demo, setDemo] = useState(createDemoState);
  const [entity, setEntity] = useState<string>();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [translationsOpen,setTranslationsOpen] = useState(false);
  const pagesRef = useRef(pages); pagesRef.current = pages;
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [future, setFuture] = useState<HistoryItem[]>([]);
  const [notice, setNotice] = useState('Ajoutez un bloc, déposez une image ou essayez un style.');
  const [flow, setFlow] = useState(0);
  const [flowOpen, setFlowOpen] = useState(false);
  const [target, setTarget] = useState(host.initialProject?.destination||{mode:host.embedded?'hanko':'standalone',url:'',realm:host.context?.realm||'',scope:'realm',client:'',theme:'aurora'});
  const [savedState,setSavedState]=useState({pages,media,target});
  const dirty=pages!==savedState.pages||media!==savedState.media||target!==savedState.target;
  useEffect(()=>{if(!dirty)return;const prevent=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',prevent);return()=>window.removeEventListener('beforeunload',prevent);},[dirty]);
  const importing=useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadRequest = useRef<{ key: string; zone: Zone; block?: string; slot?: 'brand' | 'background' }>({ key, zone: 'aside' });
  const block = page.blocks.find(b => b.id === selected);

  function commitPage(next: Page, message?: string) {
    setHistory(h => [...h.slice(-29), { key, page: sourcePage }]); setFuture([]);
    setPages(p => ({ ...p, [key]: next }));
    if (!next.i18n!.supportedLocales.includes(locale)) setLocale(next.i18n!.defaultLocale);
    if (message) setNotice(message);
  }
  function update(transform: (p: Page) => Page, message?: string) {
    commitPage(mergeLocalizedPage(sourcePage, page, transform(page), locale), message);
  }
  function setDefaultLocale(language: Locale) { commitPage(promoteLocale(sourcePage, language), 'Langue de repli mise à jour.'); }
  function toggleLocale(language: Locale, enabled: boolean) {
    const settings = sourcePage.i18n!;
    if (!enabled && language === settings.defaultLocale) return;
    const supportedLocales = enabled ? [...new Set([...settings.supportedLocales, language])] : settings.supportedLocales.filter(value => value !== language);
    commitPage({ ...sourcePage, i18n: { ...settings, supportedLocales } });
  }
  function resetTranslation() {
    const message = selectedMessage(selected, sourcePage.blocks);
    if (!message || locale === sourcePage.i18n!.defaultLocale) return;
    const messages = structuredClone(sourcePage.i18n!.messages);
    if (messages[locale]) delete messages[locale]![message];
    const automatic = { ...sourcePage.i18n!.automatic, [locale]: (sourcePage.i18n!.automatic?.[locale] || []).filter(key => key !== message) };
    commitPage({ ...sourcePage, i18n: { ...sourcePage.i18n!, messages, automatic } }, 'Le texte utilise maintenant la langue de repli.');
  }
  function editBlock(patch: Partial<Block>) { if (block) update(p => ({ ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, ...patch } : b) })); }
  function goPage(nextFamily: Family, nextIndex = '0') {
    const nextKey = nextFamily + ':' + nextIndex;
    const next = pages[nextKey] ? normalizePage(pages[nextKey], nextFamily, Number(nextIndex)) : inheritAppearance(initialPage(nextFamily, Number(nextIndex)), sourcePage);
    if (!pages[nextKey]) setPages(p => ({ ...p, [nextKey]: next }));
    setFamily(nextFamily); setPageIndex(nextIndex); setSelected(null); setPlain(false); setFlow(0); setFlowOpen(false);
    if (!next.i18n!.supportedLocales.includes(locale)) setLocale(next.i18n!.defaultLocale);
  }
  function navigateScreen(destination: string, entityId?: string) {
    const [f,index] = destination.split(':');
    if (!Object.hasOwn(families,f) || !families[f as Family].pages[Number(index)]) { setNotice('Cet écran n’est pas disponible dans l’aperçu.'); return; }
    setEntity(entityId); goPage(f as Family,index);
  }
  function changeInteractionMode(preview: boolean) {
    if (preview === testing) return;
    setTesting(preview); setSelected(null); setDragging(false); setDragBlock(null); setDragZone(null);
    if (preview) { setDemo(current=>({...createDemoState(),authenticatorSecret:current.authenticatorSecret})); setEntity(undefined); setNotice('Parcours interactif ouvert avec des données d’exemple.'); }
    else setNotice('Édition de cet écran. Les données de démonstration restent hors du projet.');
  }
  function addBlock(type: BlockType, zone: Zone = 'aside', before?: string, asset?: Asset) {
    if (page.blocks.length >= 40) { setNotice('Ce projet contient déjà 40 blocs.'); return; }
    const added = { ...makeBlock(type, zone, type === 'heading' ? 'Un titre qui vous ressemble' : type === 'text' ? 'Racontez ce qui rend votre organisation unique.' : type === 'button' ? 'En savoir plus' : ''), ...(type === 'button' ? { align: 'center' as const } : {}), ...(asset ? { src: asset.src, alt: asset.name.replace(/\.[^.]+$/, '').slice(0,160) } : {}) };
    update(p => { const blocks = [...p.blocks]; const index = before ? blocks.findIndex(b => b.id === before) : -1; index < 0 ? blocks.push(added) : blocks.splice(index, 0, added); return { ...p, blocks }; }, `${blockNames[type]} ajouté dans ${zones[zone].toLowerCase()}.`);
    setSelected(added.id);
  }
  function moveBlock(id: string, zone: Zone, before?: string) {
    if (id === before) return;
    update(p => { const moving = p.blocks.find(b => b.id === id); if (!moving) return p; const blocks = p.blocks.filter(b => b.id !== id); const index = before ? blocks.findIndex(b => b.id === before) : -1; const next = { ...moving, zone }; index < 0 ? blocks.push(next) : blocks.splice(index, 0, next); return { ...p, blocks }; }, `Bloc déplacé dans ${zones[zone].toLowerCase()}.`);
    setSelected(id);
  }
  function duplicate(id: string) { const b = page.blocks.find(b => b.id === id); if (!b || page.blocks.length >= 40) return; const copy = { ...b, id: crypto.randomUUID() }; update(p => { const blocks = [...p.blocks]; blocks.splice(blocks.findIndex(b => b.id === id) + 1, 0, copy); return { ...p, blocks }; }, 'Bloc dupliqué.'); setSelected(copy.id); }
  function remove(id: string) { update(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }), 'Bloc supprimé.'); setSelected(null); }
  function reorder(direction: number) { if (!block) return; const peers = page.blocks.filter(b => b.zone === block.zone); const adjacent = peers[peers.findIndex(b => b.id === block.id) + direction]; if (!adjacent) return; update(p => { const blocks = [...p.blocks]; const a = blocks.findIndex(b => b.id === block.id), b = blocks.findIndex(b => b.id === adjacent.id); [blocks[a], blocks[b]] = [blocks[b], blocks[a]]; return { ...p, blocks }; }); }
  function historySnapshot(entries: Snapshot[]): HistoryItem {
    const [first,...others] = entries;
    return {...first,others};
  }
  function restoreProject(project:StudioProject){setPages(project.pages);setMedia(project.media);setTarget(project.destination);const next=project.pages[key]?key:Object.keys(project.pages)[0];const [f,i]=next.split(':');setFamily(f as Family);setPageIndex(i);setSelected(null);}
  function undo() {
    const previous=history.at(-1); if(!previous) return;
    if(previous.project){setFuture(f=>[...f,{key,page:sourcePage,project:projectDocument()}]);setHistory(h=>h.slice(0,-1));restoreProject(previous.project);setNotice('Modèle annulé.');return;}
    const entries=[previous,...previous.others || []];
    setFuture(f => [...f,historySnapshot(entries.map(entry => ({key:entry.key,page:pages[entry.key]})))]);
    setHistory(h => h.slice(0,-1));setPages(p => ({...p,...Object.fromEntries(entries.map(entry => [entry.key,entry.page]))}));setSelected(null);const[f,i]=previous.key.split(':');setFamily(f as Family);setPageIndex(i);setNotice('Modification annulée.');
  }
  function redo() {
    const next=future.at(-1); if(!next) return;
    if(next.project){setHistory(h=>[...h,{key,page:sourcePage,project:projectDocument()}]);setFuture(f=>f.slice(0,-1));restoreProject(next.project);setNotice('Modèle rétabli.');return;}
    const entries=[next,...next.others || []];
    setHistory(h => [...h,historySnapshot(entries.map(entry => ({key:entry.key,page:pages[entry.key]})))]);
    setFuture(f => f.slice(0,-1));setPages(p => ({...p,...Object.fromEntries(entries.map(entry => [entry.key,entry.page]))}));setSelected(null);const[f,i]=next.key.split(':');setFamily(f as Family);setPageIndex(i);setNotice('Modification rétablie.');
  }
  function commitTranslations(changes: Record<string,Page>,message: string) {
    const entries=Object.keys(changes).map(pageKey => ({key:pageKey,page:pagesRef.current[pageKey]}));
    if(!entries.length) return;
    setHistory(h => [...h.slice(-29),historySnapshot(entries)]);setFuture([]);setPages(p => ({...p,...changes}));setNotice(message);
  }
  function openTranslations() {
    const complete=projectDocument().pages;if(Object.keys(complete).some(pageKey=>!pages[pageKey]))setPages(complete);setGalleryOpen(false);setTranslationsOpen(true);setFlowOpen(false);
  }
  function addTranslationPage(pageKey: string) {
    const [f,index]=pageKey.split(':');
    const reference=Object.entries(pagesRef.current).find(([key]) => key.startsWith(f+':'))?.[1] || sourcePage;
    setPages(p => ({...p,[pageKey]:inheritAppearance(initialPage(f as Family,Number(index)),reference)}));setNotice('Écran ajouté au projet. Ses textes peuvent être traduits.');
  }
  function viewTranslation(pageKey: string,language: Locale,textKey?: string) {
    const [f,index]=pageKey.split(':');setFamily(f as Family);setPageIndex(index);setLocale(language);setSelected(textKey ? selectionForTranslation(textKey) : null);setTesting(false);setPlain(false);setFlowOpen(false);setTranslationsOpen(false);
  }
  function startDrag(event: React.DragEvent, token: object) { event.dataTransfer.setData(transferType, JSON.stringify(token)); event.dataTransfer.effectAllowed = 'copyMove'; setDragging(true); }
  async function importFiles(files: File[], request: { key: string; zone: Zone; block?: string; slot?: 'brand' | 'background' } = { key, zone: 'aside' }) {
    if(importing.current){setNotice('Un import d’images est déjà en cours.');return;}importing.current=true;try{
    const accepted: Asset[] = []; const errors: string[] = [];
    for (const file of files.slice(0, 8)) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { errors.push(`${file.name} : format PNG, JPEG ou WebP attendu`); continue; }
      if (file.size > 5 * 1024 * 1024) { errors.push(`${file.name} : limite de 5 Mo`); continue; }
      try {
        const src = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
        const img = new Image(); img.src = src; await img.decode();
        accepted.push({ id: crypto.randomUUID(), name: file.name, src, size: file.size });
      } catch { errors.push(`${file.name} : image illisible`); }
    }
    const remainingMedia=Math.max(0,128-media.length);if(accepted.length>remainingMedia){accepted.splice(remainingMedia);errors.push('128 images maximum dans la médiathèque.');}
    const before=pagesRef.current[request.key];if(accepted.length&&!before){setNotice('L’écran a changé pendant l’import. Réessayez dans le projet actuel.');return;}
    if (accepted.length) {
      setMedia(m => [...m, ...accepted]);
      setPages(p => {
        const stored = p[request.key]; if (!stored) return p; const [f, i] = request.key.split(':'); const existing = normalizePage(stored, f as Family, Number(i));
        if (request.slot === 'brand') return { ...p, [request.key]: { ...existing, brand: { ...existing.brand, logo: accepted[0].src, alt: accepted[0].name.replace(/\.[^.]+$/, '').slice(0,160) } } };
        if (request.slot === 'background') return { ...p, [request.key]: { ...existing, appearance: { ...existing.appearance, backgroundImage: accepted[0].src } } };
        const remaining = Math.max(0, 40 - existing.blocks.length);
        const blocks = [...existing.blocks];
        const replacement = request.block ? blocks.findIndex(b => b.id === request.block) : blocks.findIndex(b => b.zone === request.zone && b.type === 'image' && !b.src);
        if (replacement >= 0) blocks[replacement] = { ...blocks[replacement], src: accepted[0].src, alt: accepted[0].name.replace(/\.[^.]+$/, '').slice(0,160) };
        for (const a of accepted.slice(replacement >= 0 ? 1 : 0, remaining + (replacement >= 0 ? 1 : 0))) blocks.push({ ...makeBlock('image', request.zone), src: a.src, alt: a.name.replace(/\.[^.]+$/, '').slice(0,160) });
        return { ...p, [request.key]: { ...existing, blocks } };
      });
      setHistory(h => [...h.slice(-29), { key: request.key, page: before }]); setFuture([]);
    }
    if (files.length > 8) errors.push('8 images maximum par import');
    setNotice([accepted.length ? `${accepted.length} image${accepted.length > 1 ? 's' : ''} ajoutée${accepted.length > 1 ? 's' : ''} au projet et à la médiathèque.` : '', ...errors].filter(Boolean).join(' '));
    setDragZone(null); setDragging(false);
    }finally{importing.current=false;}
  }
  function chooseFiles(zone: Zone = 'aside', block?: string) { uploadRequest.current = { key, zone, block }; fileInput.current?.click(); }
  function chooseAsset(slot: 'brand' | 'background') { uploadRequest.current = { key, zone: 'aside', slot }; fileInput.current?.click(); }
  function drop(event: React.DragEvent, zone: Zone, before?: string) {
    event.preventDefault(); event.stopPropagation(); setDragZone(null); setDragBlock(null); setDragging(false);
    if (event.dataTransfer.files.length) { void importFiles([...event.dataTransfer.files], { key, zone, block: page.blocks.find(b => b.id === before)?.type === 'image' ? before : undefined }); return; }
    try { const token = JSON.parse(event.dataTransfer.getData(transferType)); if (token.type) addBlock(token.type, zone, before); else if (token.id) moveBlock(token.id, zone, before); else if (token.asset) { const a = media.find(a => a.id === token.asset); if (a) addBlock('image', zone, before, a); } } catch { /* Ignore unrelated dragged content. */ }
  }
  function projectDocument():StudioProject {
    const complete = Object.fromEntries(Object.entries(pages).map(([k,p]) => { const [f,i] = k.split(':'); return [k,normalizePage(p,f as Family,Number(i))]; }));
    for (const f of ['account','admin'] as const) {
      const reference = complete[`${f}:0`] || complete[Object.keys(complete).find(k => k.startsWith(f+':')) || ''];
      if (reference) for (const screen of Object.values(journeyScreens).filter(s => s.family === f)) {
        const destination = `${f}:${screen.index}`;
        complete[destination] ||= inheritAppearance(initialPage(f,screen.index),reference);
      }
    }
    return { format:'hanko.theme-studio.project/v1',name:target.theme,pages:complete,media,destination:target,publication:{status:'draft',built:false,deployed:false,attached:false} };
  }
  async function saveModel(){if(!modelName.trim())return;setSaving(true);try{const document=projectDocument();await requireValidDocument(contractBase,'project',document);if(host.onSaveTemplate)await host.onSaveTemplate(modelName.trim(),document);else{const url=URL.createObjectURL(new Blob([JSON.stringify(document,null,2)],{type:'application/json'}));const download=globalThis.document.createElement('a');download.href=url;download.download=document.name+'.template.json';download.click();URL.revokeObjectURL(url);}setModelOpen(false);setNotice('Modèle enregistré.');}catch(error){setNotice(error instanceof Error?error.message:'Enregistrement impossible.');}finally{setSaving(false);}}
  async function saveProject(){if(!host.onSave)return;setSaving(true);try{const baseline={pages,media,target};const document=projectDocument();await requireValidDocument(contractBase,'project',document);await host.onSave(document);setSavedState(baseline);setNotice('Projet enregistré.');}catch(error){setNotice(error instanceof Error?error.message:'Enregistrement impossible.');}finally{setSaving(false);}}
  async function exportProject() {
    try{const project = projectDocument();await requireValidDocument(contractBase,'project',project);
    const href = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = href; a.download = `${target.theme || 'theme'}.studio.json`; a.click(); URL.revokeObjectURL(href); setNotice('Projet exporté avec ses contenus et ses images.');
    }catch(error){setNotice(error instanceof Error?error.message:'Export impossible.');}
  }
  function readPage(value: unknown, f = family, index = Number(pageIndex)): Page {
    const input = value as Partial<Page>;
    if (Object.hasOwn(input, 'application')) throw new Error('Le contrat applicatif est valide ; son aperçu composable reste à raccorder au SDK.');
    if (input.blocks?.some(b => !Object.hasOwn(blockNames, b.type))) throw new Error('Ce document utilise un bloc de plugin dont le renderer n’est pas installé.');
    const configured = presets.find(style => style.id === input.preset) || presets[0];
    let base = stylePage(initialPage(f, index), configured);
    if (input.i18n?.defaultLocale && input.i18n.defaultLocale !== base.i18n!.defaultLocale) base = promoteLocale(base, input.i18n.defaultLocale);
    if (input.accent) { base.accent = input.accent; base.native.buttonBackground = input.accent; }
    return initializeI18n({ ...base, ...input, i18n: input.i18n, brand: { ...base.brand, ...input.brand }, appearance: { ...base.appearance, ...input.appearance }, native: { ...base.native, ...input.native, copy: { ...base.native.copy, ...input.native?.copy }, styles: input.native?.styles || {} }, blocks: (input.blocks || []).map(b => ({ ...makeBlock(b.type, b.zone), ...b })) });
  }
  async function applyGallery(selection:GalleryApply){
    setApplyingTemplate(true);
    try {
    if(selection.kind==='section'){
      const section=catalogue.sections.find(value=>value.id===selection.section);if(!section)throw Error('Section absente du catalogue.');
      if(page.blocks.length+section.blocks.length>40)throw Error('Cet écran ne peut pas dépasser 40 blocs.');
      update(p=>({...p,blocks:[...p.blocks,...section.blocks.map(value=>({...makeBlock(value.type as BlockType,value.zone as Zone),...value,type:value.type as BlockType,zone:value.zone as Zone,id:crypto.randomUUID(),text:builtin(value.text,'fr',locale)||value.text,align:value.align as Block['align']}))]}),'Section ajoutée.');
      setGalleryOpen(false);setTesting(false);return;
    }
    if(selection.document)assertEditableProject(selection.document);
    const available=selection.document?.pages||themePages(selection.theme!);
    const incoming=selection.kind==='page'?{[selection.page!]:available[selection.page!]}:available;
    const next:Record<string,Page>={};
    for(const [pageKey,document]of Object.entries(incoming)){
      const [f,i]=pageKey.split(':');if(!Object.hasOwn(families,f)||!families[f as Family].pages[Number(i)])throw Error('Écran non disponible dans le Studio.');let item=readPage(document,f as Family,Number(i));const old=pages[pageKey];
      if(selection.preserveContent&&old)item={...item,blocks:structuredClone(old.blocks),subject:old.subject,native:{...item.native,copy:structuredClone(old.native.copy)},i18n:structuredClone(old.i18n)};
      if(selection.preserveBrand){const brand=(old||sourcePage).brand;item.brand={...item.brand,name:brand.name,mark:brand.mark,logo:brand.logo,alt:brand.alt};const messages=structuredClone(item.i18n!.messages);for(const language of item.i18n!.supportedLocales){for(const field of ['brand.name','brand.alt']){const value=(old||sourcePage).i18n?.messages[language]?.[field];if(value!==undefined)messages[language]={...messages[language],[field]:value};else if(messages[language])delete messages[language]![field];}}item.i18n={...item.i18n!,messages};}
      next[pageKey]=item;
    }
    const nextMedia=[...media];for(const asset of selection.document?.media||[])if(!nextMedia.some(existing=>existing.src===asset.src))nextMedia.push({...asset,id:crypto.randomUUID()});
    await requireValidDocument(contractBase,'project',{...projectDocument(),pages:{...pages,...next},media:nextMedia});
    setHistory(h=>[...h.slice(-29),{key,page:sourcePage,project:projectDocument()}]);setFuture([]);setPages(p=>({...p,...next}));setMedia(nextMedia);
    const destination=selection.page||(available['login:0']?'login:0':Object.keys(available)[0]);const [f,i]=destination.split(':');setFamily(f as Family);setPageIndex(i);setSelected(null);setTesting(false);setPlain(false);setGalleryOpen(false);setNotice(selection.kind==='theme'?'Thème complet appliqué. Tous ses écrans restent modifiables.':'Page du modèle appliquée.');
    } finally { setApplyingTemplate(false); }
  }
  function importProject(value: unknown) {
    assertEditableProject(value);
    const input = value as { pages: Record<string, unknown>; media?: Asset[]; plugins?: unknown[]; destination?: typeof target; name: string };
    if (input.plugins?.length) throw new Error('L’installation de plugins n’est pas encore raccordée à la maquette.');
    const imported: Record<string, Page> = {};
    for (const [pageKey, document] of Object.entries(input.pages)) {
      const [f, index] = pageKey.split(':');
      if (!Object.hasOwn(families, f) || !families[f as Family].pages[Number(index)]) throw new Error('Cette page ne dispose pas encore d’un aperçu installé : ' + pageKey);
      imported[pageKey] = readPage(document, f as Family, Number(index));
    }
    const [firstFamily, firstIndex] = Object.keys(imported)[0].split(':');
    setPages(imported); setMedia(input.media || []); setFamily(firstFamily as Family); setPageIndex(firstIndex); setTarget({...input.destination||{...target,theme:input.name},...(host.context?.realm?{realm:host.context.realm}:{})}); if (!imported[Object.keys(imported)[0]].i18n!.supportedLocales.includes(locale)) setLocale(imported[Object.keys(imported)[0]].i18n!.defaultLocale); setSelected(null); setHistory([]); setFuture([]); setNotice('Projet JSON importé et validé.');
  }
  function openPlanScreen(destination:string){setGalleryOpen(false);setTranslationsOpen(false);setFlowOpen(false);setJsonOpen(false);setTesting(false);navigateScreen(destination);}
  function openPlanView(view:StudioView){setJsonOpen(false);setGalleryOpen(false);setTranslationsOpen(false);setFlowOpen(false);setTesting(false);if(view==='catalog')setGalleryOpen(true);else if(view==='translations')openTranslations();else if(view==='contracts')setJsonOpen(true);else if(view!=='editor'){setFlow({validate:1,build:2,deploy:3,attach:4}[view]);setFlowOpen(true);}}
  async function exportApplication() {
    let code:string;try{const document=projectDocument();await requireValidDocument(contractBase,'project',document);code=applicationSource(document);}catch(cause){setNotice(cause instanceof Error?cause.message:'Export indisponible.');return;}
    const href = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = href; link.download = `${target.theme || 'theme'}-identity-screens.tsx`; link.click(); URL.revokeObjectURL(href);
    setNotice('Écrans React/Next exportés avec leurs blocs, images, styles et traductions. Branchez vos formulaires et opérations authentifiés avec renderNative.');
  }
  function renderDropzone({ compact = false }: { compact?: boolean }) {
    return <div className={`upload-zone ${compact ? 'compact' : ''}`} data-over={dragZone === 'media'} onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragZone('media'); } }} onDragLeave={() => setDragZone(null)} onDrop={e => { e.preventDefault(); void importFiles([...e.dataTransfer.files]); }}><UploadCloud size={compact ? 22 : 30} /><strong>Déposez vos images ici</strong><span>PNG, JPEG, WebP · 5 Mo par image</span><Button variant="outline" size="sm" onClick={() => chooseFiles()}>Parcourir les fichiers</Button></div>;
  }
  function removeAsset(id:string){setHistory(h=>[...h.slice(-29),{key,page:sourcePage,project:projectDocument()}]);setFuture([]);setMedia(previous=>previous.filter(asset=>asset.id!==id));setNotice('Image retirée de la médiathèque. Les images déjà placées dans les pages sont conservées.');}
  function renderMediaGrid() { return <div className="media-grid">{media.map(a => <div className="media-item" key={a.id}><button type="button" className="media-asset" draggable onDragStart={e => startDrag(e, { asset: a.id })} onDragEnd={() => setDragging(false)} onClick={() => addBlock('image', 'aside', undefined, a)} aria-label={`Ajouter ${a.name}`}><img src={a.src} alt="" /><span>{a.name}</span><Plus size={14} /></button><Button variant="ghost" size="icon" className="media-remove" aria-label={'Retirer '+a.name+' de la médiathèque'} onClick={()=>removeAsset(a.id)}><Trash2 size={14}/></Button></div>)}</div>; }
  function renderNativeBlock() {
    return <JourneyScreen key={`${key}:${testing}:${entity || ''}`} page={page} family={family} index={pageIndex} locale={locale} testing={testing} selected={selected} onSelect={part => setSelected(part ? '@native:'+part : '@native')} onChange={(part,value) => update(p => ({...p,native:{...p.native,copy:{...p.native.copy,[part]:value}}}))} onNavigate={navigateScreen} demo={demo} onDemo={setDemo} entity={entity}/>;
  }
  function renderCanvasBlock({ b }: { b: Block }) {
    const style = b.style || {};
    if (testing) {
      const visualStyle = {textAlign:style.align || (languages[locale].direction === 'rtl' && b.align === 'left' ? 'right' : b.align),...elementStyle(style)} as React.CSSProperties;
      let content: React.ReactNode = b.type === 'image' ? b.src ? <img src={b.src} alt={b.alt} style={{height:style.imageHeight,maxHeight:style.imageHeight || 240,objectFit:style.fit || 'contain',borderRadius:style.radius ?? page.radius}}/> : null : b.type === 'divider' ? <hr style={{background:style.color,height:style.imageHeight}}/> : <span className={b.type === 'heading' ? 'content-heading' : b.type === 'button' ? 'content-button' : 'content-text'} style={visualStyle}>{sample(b.text)}</span>;
      if (b.type === 'button') {
        const destination = (b.href || '').replace(/^#/,'').replace('-',':');
        content = Object.hasOwn(journeyScreens,destination) ? <button type="button" className="preview-block-button" onClick={() => navigateScreen(destination)}>{content}</button> : b.href && /^(https:\/\/|mailto:)/.test(b.href) ? <a href={b.href} target="_blank" rel="noopener noreferrer">{content}</a> : <button type="button" className="preview-block-button" onClick={() => setNotice('Choisissez un écran de destination ou un lien pour ce bouton dans le mode édition.')}>{content}</button>;
      }
      return <article key={b.id} className="canvas-block preview-block" style={{width:style.width ? style.width+'%' : undefined}}>{content}</article>;
    }
    return <article key={b.id} className="canvas-block" data-selected={selected === b.id} data-drop-before={dragBlock === b.id} style={{ width: style.width ? style.width + '%' : undefined, marginInline: (style.align || b.align) === 'center' ? 'auto' : (style.align || b.align) === 'right' ? 'auto 0' : undefined }} draggable onDragStart={e => { if ((e.target as Element).closest('[contenteditable=true]')) { e.preventDefault(); return; } e.stopPropagation(); startDrag(e, { id: b.id }); }} onDragEnd={() => { setDragging(false); setDragBlock(null); }} onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragBlock(b.id); }} onDrop={e => drop(e, b.zone, b.id)} onClick={e => { e.stopPropagation(); setSelected(b.id); }}>
      <button type="button" className="block-drag-handle" aria-label={`Déplacer ${blockNames[b.type].toLowerCase()}`} draggable onDragStart={e => { e.stopPropagation(); startDrag(e, { id: b.id }); }} onClick={() => setSelected(b.id)}><GripVertical size={14} /></button>
      {['heading', 'text', 'button'].includes(b.type) ? <InlineText value={b.text} label={`Modifier ${blockNames[b.type].toLowerCase()} du bloc`} className={b.type === 'heading' ? 'content-heading' : b.type === 'button' ? 'content-button' : 'content-text'} style={{ textAlign: style.align || (languages[locale].direction === 'rtl' && b.align === 'left' ? 'right' : b.align), ...elementStyle(style) }} onSelect={() => setSelected(b.id)} onChange={value => update(p => ({ ...p, blocks: p.blocks.map(block => block.id === b.id ? { ...block, text: value } : block) }))} /> : <button type="button" className="block-select" aria-label={`Sélectionner ${blockNames[b.type]} ${b.text.slice(0, 30)}`} onClick={() => setSelected(b.id)} style={{ textAlign: b.align }}>{b.type === 'divider' ? <hr style={{ background: style.color, height: style.imageHeight }} /> : b.src ? <img src={b.src} alt={b.alt} style={{ height: style.imageHeight, maxHeight: style.imageHeight || 240, objectFit: style.fit || 'contain', borderRadius: style.radius ?? page.radius }} /> : <span className="image-placeholder"><ImagePlus size={32} /><strong>Votre image prend place ici</strong><span>Déposez une image ou sélectionnez ce bloc</span></span>}</button>}
      {selected === b.id && <div className="block-toolbar"><span><GripVertical size={13} />{blockNames[b.type]}</span><button type="button" onClick={e => { e.stopPropagation(); duplicate(b.id); }} aria-label="Dupliquer le bloc sélectionné"><Copy size={13} /></button><button type="button" onClick={e => { e.stopPropagation(); remove(b.id); }} aria-label="Supprimer le bloc sélectionné"><Trash2 size={13} /></button></div>}
    </article>;
  }
  function renderZone({ zone }: { zone: Zone }) {
    const contents = page.blocks.filter(b => b.zone === zone);
    if (testing) return <div className={`canvas-zone zone-${zone} preview-zone`}>{contents.map(b => renderCanvasBlock({b}))}</div>;
    return <div className={`canvas-zone zone-${zone}`} data-zone={zone} data-over={dragZone === zone} data-dragging={dragging} onDragOver={e => { e.preventDefault(); setDragZone(zone); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragZone(null); }} onDrop={e => drop(e, zone)}><span className="zone-name">{zones[zone]}</span>{contents.map(b => renderCanvasBlock({ b }))}{!contents.length && <button type="button" className="zone-empty" onClick={() => addBlock('text', zone)}><Plus size={16} />Déposer ou ajouter un bloc</button>}</div>;
  }

  return <div className="studio" data-embedded={host.embedded||false} onDragEnd={() => { setDragging(false); setDragZone(null); }}>
    <input ref={fileInput} type="file" aria-label="Importer des images" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={e => { void importFiles([...(e.target.files || [])], uploadRequest.current); e.target.value = ''; }} />
    <header className="studio-header"><div className="studio-brand"><span className="brand-mark">H</span><div><strong>Theme Studio</strong><span>{host.context?.label||'Projet de thème'}</span></div><span className="prototype-badge">Brouillon</span></div><div className="header-actions"><NavigationPlan screen={key} onNavigate={openPlanScreen} onView={openPlanView}/>{host.onSave&&<Button size="sm" disabled={saving||applyingTemplate} onClick={()=>void saveProject()}>{saving?'Enregistrement…':'Enregistrer'}</Button>}<Button variant="ghost" size="icon" aria-label="Annuler" disabled={applyingTemplate||!history.length} onClick={undo}><Undo2 size={17} /></Button><Button variant="ghost" size="icon" aria-label="Rétablir" disabled={applyingTemplate||!future.length} onClick={redo}><Redo2 size={17} /></Button><Button variant="outline" size="sm" disabled={applyingTemplate} onClick={exportProject}><Download size={15} /><span>Exporter le projet</span></Button><Button variant={galleryOpen?"secondary":"outline"} size="sm" aria-pressed={galleryOpen} onClick={()=>{setGalleryOpen(!galleryOpen);setTranslationsOpen(false);setFlowOpen(false);}}><LayoutTemplate size={15}/>Modèles</Button><Button variant={translationsOpen ? "secondary" : "outline"} size="sm" aria-pressed={translationsOpen} onClick={() => translationsOpen ? setTranslationsOpen(false) : openTranslations()}><Languages size={15}/>Traductions</Button><Button variant="outline" size="sm" disabled={applyingTemplate} onClick={() => setJsonOpen(true)}>JSON</Button><Button variant="outline" size="sm" disabled={applyingTemplate} onClick={()=>{setModelName(target.theme);setModelOpen(true);}}>Enregistrer comme modèle</Button><Button variant="outline" size="sm" disabled={applyingTemplate} onClick={exportApplication}><Type size={15} />Écrans React/Next</Button><Button size="sm" disabled={applyingTemplate} onClick={() => { setGalleryOpen(false); setTranslationsOpen(false); setFlowOpen(true); setFlow(1); }}><Rocket size={15} />Publication</Button></div></header>
    {galleryOpen?<TemplateGallery onClose={()=>setGalleryOpen(false)} onApply={applyGallery}/>:translationsOpen ? <TranslationWorkspace pages={pages} name={target.theme} initialPage={key} initialLocale={locale} onChanges={commitTranslations} onAdd={addTranslationPage} onView={viewTranslation} onClose={() => setTranslationsOpen(false)}/> : <><nav className="flow-strip" aria-label="Parcours de publication">{flowNames.map((name, i) => <React.Fragment key={name}><button type="button" className="flow-step" aria-label={name} aria-current={flowOpen ? flow === i ? 'step' : undefined : i === 0 ? 'step' : undefined} onClick={() => { setFlow(i); setFlowOpen(i !== 0); }}><span>{i === 0 ? <Palette size={13} /> : i + 1}</span>{name}</button>{i < 4 && <ChevronRight size={13} className="flow-chevron" />}</React.Fragment>)}<span className="flow-connection">{host.publication?'Publication via Hanko':'Construction avec le CLI'}</span></nav>
    {!flowOpen&&<div className="editor-toolbar"><div className="page-pickers"><Choice id="theme-family" label="Type de thème" value={family} options={Object.entries(families).map(([value, f]) => ({ value, label: f.label }))} onChange={v => goPage(v as Family)} /></div><div className="preview-tools"><Choice id="theme-locale" label="Langue de l’écran" value={locale} options={sourcePage.i18n!.supportedLocales.map(value => ({ value, label: languages[value].label }))} onChange={value => setLocale(value as Locale)} /><div className="device-switch"><Button variant="ghost" size="sm" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor size={15} />Bureau</Button><Button variant="ghost" size="sm" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={15} />Mobile</Button></div>{family === 'email' && <Button variant="outline" size="sm" aria-pressed={plain} onClick={() => setPlain(!plain)}>{plain ? 'Version HTML' : 'Version texte'}</Button>}</div></div>}
    {!flowOpen&&!testing&&<ScreenNavigation screen={key} onNavigate={navigateScreen}/>}
    {!flowOpen && <div className="interaction-strip"><div className="interaction-modes" role="group" aria-label="Mode du Studio"><Button variant={testing ? 'ghost' : 'secondary'} size="sm" aria-pressed={!testing} onClick={() => changeInteractionMode(false)}><Pencil size={14}/>Modifier</Button><Button variant={testing ? 'default' : 'outline'} size="sm" aria-pressed={testing} onClick={() => changeInteractionMode(true)}><Play size={14}/>Tester le parcours</Button></div><p>{testing ? 'Parcours simulé · données d’exemple. Cliquez pour naviguer et essayer les formulaires.' : 'Cliquez pour modifier. « Voir » ouvre la destination d’une action ; « Tester le parcours » permet de l’utiliser.'}</p></div>}
    {flowOpen ? <PublicationWorkspace project={projectDocument()} step={flow} onStep={setFlow} onSaved={()=>setSavedState({pages,media,target})} onClose={() => {setFlowOpen(false);setFlow(0);}} onDestination={setTarget} onExport={exportProject} onExportApplication={exportApplication}/> : <div className="editor-grid" data-testing={testing}>
      {testing ? <JourneyLibrary family={family} index={pageIndex} onNavigate={navigateScreen}/> : <aside className="library" aria-label="Bibliothèque de construction"><Tabs value={tab === 'templates' ? 'blocks' : tab} onValueChange={setTab}><TabsList className="library-tabs" aria-label="Bibliothèques"><TabsTrigger value="blocks"><Plus size={17} /><span>Blocs</span></TabsTrigger><TabsTrigger value="styles"><Palette size={17} /><span>Styles</span></TabsTrigger><TabsTrigger value="media"><ImagePlus size={17} /><span>Médias</span></TabsTrigger><TabsTrigger value="layers"><Layers size={17} /><span>Calques</span></TabsTrigger></TabsList>
        <TabsContent value="blocks" className="library-content"><h2>Composez votre écran</h2><p className="secondary">Glissez un bloc dans une zone ou cliquez pour l’ajouter.</p><div className="block-library">{(Object.keys(blockNames) as BlockType[]).map(type => { const Icon = icons[type]; return <button type="button" key={type} draggable onDragStart={e => startDrag(e, { type })} onClick={() => addBlock(type)} data-add={type}><Icon size={22} /><span>{blockNames[type]}</span><GripVertical size={13} /></button>; })}</div><div className="section-heading"><h2>Vos images</h2><span>{media.length}</span></div>{renderDropzone({ compact: true })}<div className="section-heading"><h2>Apparence de l’écran</h2></div><Button variant="outline" className="full-width" onClick={() => setTab('styles')}><Palette size={16} />Personnaliser les styles<ArrowRight size={14} /></Button></TabsContent>
        <TabsContent value="styles" className="library-content"><ScreenStyles page={page} onChange={update} /></TabsContent>
        <TabsContent value="media" className="library-content"><h2>Médiathèque du projet</h2><p className="secondary">Importez plusieurs visuels, puis glissez-les sur l’écran ou cliquez pour les réutiliser.</p>{renderDropzone({})}{renderMediaGrid()}{!media.length && <p className="secondary media-empty">Vos images apparaîtront ici après l’import.</p>}</TabsContent>
        <TabsContent value="layers" className="library-content"><h2>Structure de l’écran</h2><p className="secondary">Sélectionnez ou déplacez un bloc entre les zones.</p>{(Object.keys(zones) as Zone[]).map(zone => <div key={zone} className="layer-zone"><h3>{zones[zone]}</h3>{page.blocks.filter(b => b.zone === zone).map(b => <button type="button" key={b.id} draggable onDragStart={e => startDrag(e, { id: b.id })} onClick={() => setSelected(b.id)} aria-pressed={selected === b.id}><GripVertical size={14} /><span>{b.type === 'image' ? b.alt || 'Image' : b.text || blockNames[b.type]}</span></button>)}</div>)}<button type="button" className="protected-layer" onClick={() => setSelected('@native')}><LockKeyhole size={15} />Formulaire Keycloak · modifiable</button><button type="button" className="protected-layer" onClick={() => setSelected('@brand')}>Identité de marque · modifiable</button></TabsContent>
      </Tabs></aside>}
      <Canvas className="canvas-area" aria-label="Écran en construction"><div className="locale-status" data-missing={coverage.missing.length > 0}>{languages[locale].label} · {coverage.translated}/{coverage.total} textes traduits{coverage.missing.length ? ` · ${coverage.missing.length} texte(s) en ${languages[coverage.defaultLocale].label} par repli` : ''}</div>{family === 'email' && <label className="subject-field">Objet du courriel<Input value={page.subject} onChange={e => update(p => ({ ...p, subject: e.target.value }))} /></label>}
        <PreviewContext.Provider value={testing}><div className="theme-page" data-family={family} data-testing={testing} lang={locale} dir={languages[locale].direction} data-device={device} data-layout={page.layout} data-density={page.appearance.density} style={{ '--page-accent': page.accent, '--page-bg': page.appearance.background, '--page-surface': page.appearance.surface, '--page-fg': page.appearance.foreground, '--page-muted': page.appearance.muted, '--page-radius': page.radius + 'px', '--page-padding': page.appearance.padding + 'px', '--page-gap': page.appearance.gap + 'px', '--page-max': page.appearance.contentWidth + 'px', fontFamily: page.appearance.font, backgroundImage: page.appearance.backgroundImage ? `url(${page.appearance.backgroundImage})` : undefined, backgroundSize: page.appearance.backgroundFit, backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } as React.CSSProperties} onClick={() => {if (!testing) setSelected(null);}}>
          <div className="page-brand" data-selected={selected === '@brand'} style={{ justifyContent: page.brand.align === 'center' ? 'center' : page.brand.align === 'right' ? 'flex-end' : 'flex-start', color: page.brand.color, fontSize: page.brand.fontSize }} onClick={e => { e.stopPropagation(); if (!testing) setSelected('@brand'); }} onDragOver={e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }} onDrop={e => { e.preventDefault(); e.stopPropagation(); if (!testing) void importFiles([...e.dataTransfer.files], { key, zone: 'header', slot: 'brand' }); }}>
            {page.brand.logo ? <button type="button" className="brand-logo" aria-label="Sélectionner le logo" onClick={() => testing ? navigateScreen(family === 'admin' ? 'admin:0' : 'account:0') : setSelected('@brand')}><img src={page.brand.logo} alt={page.brand.alt} style={{ height: page.brand.size }} /></button> : <span className="brand-monogram" style={{ background: page.accent, width: page.brand.size, height: page.brand.size }}><InlineText value={page.brand.mark} label="Modifier le monogramme" multiline={false} onSelect={() => setSelected('@brand')} onChange={mark => update(p => ({ ...p, brand: { ...p.brand, mark } }))} /></span>}
            <InlineText value={page.brand.name} label="Modifier le nom de la marque" multiline={false} onSelect={() => setSelected('@brand')} onChange={name => update(p => ({ ...p, brand: { ...p.brand, name } }))} />
          </div><ApplicationNavigation family={family} index={pageIndex} locale={locale} onNavigate={navigateScreen}/>{plain && family === 'email' ? <pre>{page.blocks.filter(b => b.type !== 'divider').map(b => b.type === 'image' ? `[${b.alt}]` : sample(b.text)).join('\n\n')}{'\n\n' + sample(page.native.copy.title) + '\n' + sample(page.native.copy.description) + '\n\n' + page.native.copy.action + ' : [Lien d’action fourni par Keycloak]'}</pre> : <>{renderZone({ zone: "header" })}<div className="theme-body">{renderZone({ zone: "aside" })}{renderNativeBlock()}</div>{renderZone({ zone: "footer" })}</>}
        </div></PreviewContext.Provider><div className="canvas-hint">{testing ? <Play size={13}/> : <LockKeyhole size={13}/>} {testing ? 'Cliquez sur les actions pour explorer les écrans. Utilisez « Modifier » pour personnaliser l’écran affiché.' : 'Cliquez pour modifier les textes et les styles. Les destinations des actions sont indiquées sous les boutons.'}</div>
      </Canvas>
      {testing ? <JourneyMap family={family} index={pageIndex} onNavigate={navigateScreen} testing onEdit={() => changeInteractionMode(false)}/> : <Inspector onNavigate={navigateScreen} locale={locale} localeSettings={sourcePage.i18n!} coverage={coverage} onDefaultLocale={setDefaultLocale} onToggleLocale={toggleLocale} onResetTranslation={resetTranslation} page={page} family={family} pageIndex={pageIndex} selected={selected} onSelect={setSelected} onPage={update} onBlock={editBlock} chooseImage={() => { if(block) chooseFiles(block.zone, block.id); }} chooseAsset={chooseAsset} duplicate={() => { if(block) duplicate(block.id); }} remove={() => { if(block) remove(block.id); }} reorder={reorder} openMedia={() => setTab('media')} openStyles={() => setTab('styles')} />}
    </div>}
    </>}
    <Dialog.Root open={modelOpen} onOpenChange={setModelOpen}><Dialog.Portal container={portal}><Dialog.Overlay className="json-overlay"/><Dialog.Content className="json-dialog model-dialog"><Dialog.Title>Enregistrer comme modèle</Dialog.Title><Dialog.Description>Conservez une copie réutilisable de ce thème, de ses pages et de ses traductions.</Dialog.Description><label className="field">Nom du modèle<Input aria-label="Nom du modèle" value={modelName} maxLength={128} onChange={event=>setModelName(event.target.value)}/></label><div className="json-dialog-actions"><Dialog.Close asChild><Button variant="outline">Annuler</Button></Dialog.Close><Button disabled={saving||!modelName.trim()} onClick={()=>void saveModel()}>Enregistrer le modèle</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <JsonEditor open={jsonOpen} onOpenChange={setJsonOpen} page={sourcePage} project={jsonOpen ? projectDocument() : {}} onPage={value => { const next = readPage(value); commitPage(next, 'Page JSON appliquée.'); setSelected(null); }} onProject={importProject} />
    <footer className="studio-footer" data-dirty={dirty}><span role="status" aria-live="polite">{notice}</span><span>{dirty?'Modifications non enregistrées · ':''}{host.context?host.context.kind==='organization'?'Projet de l’organisation':'Projet du cluster':'Projet local'} · {page.blocks.length} blocs · {media.length} images</span></footer>
  </div>;
}
