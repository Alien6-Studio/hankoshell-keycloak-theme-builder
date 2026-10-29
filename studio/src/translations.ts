import { blockNames, families, nativePartNames, type Family, type NativePart, type Page } from './model';
import { initializeI18n, languages, mergeLocalizedPage, textValues, type Locale } from './i18n';
import { screenParts } from './journeys';

export type TranslationState = 'source' | 'shared' | 'empty' | 'missing' | 'prefilled' | 'translated' | 'invalid' | 'inactive';
export type TranslationEntry = { key: string; label: string; source: string };
export type TranslationBundle = { format: 'hanko.theme-studio.translations/v1'; name: string; locale: Locale; pages: Record<string,{sourceLocale:Locale;sources:Record<string,string>;messages:Record<string,string>}> };
export function translationMaxLength(key: string) { return key === 'subject' ? 120 : key === 'brand.name' ? 128 : key.endsWith('.alt') ? 160 : 800; }
export function pageName(key: string) {
  const [family,index] = key.split(':');
  return `${families[family as Family].label} / ${families[family as Family].pages[Number(index)]}`;
}
export function translationEntries(page: Page, pageKey: string): TranslationEntry[] {
  const [family,index] = pageKey.split(':');
  const values = textValues(page);
  const fields: {key:string;label:string}[] = [
    {key:'brand.name',label:'Nom de la marque'},
    ...(page.brand.logo ? [{key:'brand.alt',label:'Description du logo'}] : []),
    ...(family === 'email' ? [{key:'subject',label:'Objet du courriel'}] : []),
    ...screenParts(family as Family,index).filter(part => !part.endsWith('Example')).map(part => ({key:'native.'+part,label:nativePartNames[part]})),
    ...page.blocks.flatMap((block,index) => block.type === 'divider' ? [] : [{key:`blocks.${block.id}.${block.type === 'image' ? 'alt' : 'text'}`,label:`${blockNames[block.type]} ${index+1} · ${block.type === 'image' ? 'Texte alternatif' : block.zone === 'header' ? 'En-tête' : block.zone === 'footer' ? 'Pied de page' : 'Zone latérale'}`}]),
  ];
  return fields.map(field => ({...field,source:values[field.key] ?? ''}));
}
export function variableDifference(source: string, translation: string) {
  const tokens = (value: string) => value.match(/\{\{[^{}]+\}\}|\{[0-9]+\}/g) || [];
  const before = tokens(source), after = tokens(translation);
  const missing = [...new Set(before)].filter(token => before.filter(t => t === token).length > after.filter(t => t === token).length);
  const extra = [...new Set(after)].filter(token => after.filter(t => t === token).length > before.filter(t => t === token).length);
  return {missing,extra};
}
export function translationState(page: Page, entry: TranslationEntry, locale: Locale): TranslationState {
  const settings = initializeI18n(page).i18n!;
  if (!settings.supportedLocales.includes(locale)) return 'inactive';
  if (settings.defaultLocale === locale) return 'source';
  const messages = settings.messages[locale] || {};
  if (!Object.hasOwn(messages,entry.key)) return entry.key === 'brand.name' ? 'shared' : entry.source.trim() ? 'missing' : 'empty';
  const diff = variableDifference(entry.source,messages[entry.key]);
  if (diff.missing.length || diff.extra.length) return 'invalid';
  return settings.automatic?.[locale]?.includes(entry.key) ? 'prefilled' : 'translated';
}
function replaceText(page: Page, key: string, value: string): Page {
  if (key === 'subject') return {...page,subject:value};
  if (key === 'brand.name' || key === 'brand.alt') return {...page,brand:{...page.brand,[key.slice(6)]:value}};
  if (key.startsWith('native.')) return {...page,native:{...page.native,copy:{...page.native.copy,[key.slice(7)]:value}}};
  const field = key.endsWith('.text') ? 'text' : 'alt';
  const id = key.slice(7,-field.length-1);
  return {...page,blocks:page.blocks.map(block => block.id === id ? {...block,[field]:value} : block)};
}
export function writeTranslation(input: Page, key: string, locale: Locale, value: string | undefined): Page {
  const page = initializeI18n(input), settings = page.i18n!;
  if (!Object.hasOwn(textValues(page),key)) throw new Error('Ce texte n’existe plus dans le projet.');
  if (value !== undefined && value.length > translationMaxLength(key)) throw new Error('Ce texte dépasse la longueur autorisée.');
  if (!settings.supportedLocales.includes(locale)) throw new Error('Activez cette langue pour cet écran avant de la modifier.');
  if (locale === settings.defaultLocale) {
    if (value === undefined) throw new Error('Le texte source ne peut pas utiliser un repli.');
    return mergeLocalizedPage(page,page,replaceText(page,key,value),locale);
  }
  const messages = structuredClone(settings.messages);
  messages[locale] = {...messages[locale]};
  if (value === undefined) delete messages[locale]![key]; else messages[locale]![key] = value;
  const automatic = {...settings.automatic,[locale]:(settings.automatic?.[locale] || []).filter(item => item !== key)};
  return {...page,i18n:{...settings,messages,automatic}};
}
export function exportTranslations(pages: Record<string,Page>, name: string, locale: Locale): TranslationBundle {
  return {format:'hanko.theme-studio.translations/v1',name,locale,pages:Object.fromEntries(Object.entries(pages).map(([key,page]) => {
    const settings = initializeI18n(page).i18n!, entries = translationEntries(page,key);
    const messages = settings.defaultLocale === locale ? {} : Object.fromEntries(entries.filter(entry => Object.hasOwn(settings.messages[locale] || {},entry.key)).map(entry => [entry.key,settings.messages[locale]![entry.key]]));
    return [key,{sourceLocale:settings.defaultLocale,sources:Object.fromEntries(entries.map(entry => [entry.key,entry.source])),messages}];
  }))};
}
/** Resolve every edit before applying the bundle, so stale imports remain atomic. */
export function importTranslations(bundle: TranslationBundle, pages: Record<string,Page>, name: string): Record<string,Page> {
  if (bundle.format !== 'hanko.theme-studio.translations/v1' || bundle.name !== name || !Object.hasOwn(languages,bundle.locale)) throw new Error('Ce fichier ne correspond pas au projet ou au format de traductions.');
  const changes: Record<string,Page> = {};
  for (const [key,document] of Object.entries(bundle.pages)) {
    if (!Object.hasOwn(pages,key)) throw new Error('Écran absent du projet : '+key);
    const page = initializeI18n(pages[key]), settings = page.i18n!;
    if (document.sourceLocale !== settings.defaultLocale) throw new Error('La langue source a changé : '+pageName(key));
    const entries = translationEntries(page,key);
    let next = page;
    for (const [message,value] of Object.entries(document.messages)) {
      const entry = entries.find(item => item.key === message);
      if (!entry || !Object.hasOwn(document.sources,message) || document.sources[message] !== entry.source) throw new Error('Le texte source a changé ou n’existe plus : '+pageName(key)+' · '+message);
      if (bundle.locale === settings.defaultLocale) throw new Error('L’import de traductions ne modifie pas les textes source.');
      const diff = variableDifference(entry.source,value);
      if (diff.missing.length || diff.extra.length) throw new Error('Variables à conserver : '+pageName(key)+' · '+entry.label);
      next = writeTranslation(next,message,bundle.locale,value);
    }
    if (next !== page) changes[key] = next;
  }
  return changes;
}
export function selectionForTranslation(key: string) {
  if (key.startsWith('native.')) return '@native:'+key.slice(7) as `@native:${NativePart}`;
  if (key.startsWith('brand.')) return '@brand';
  if (key.startsWith('blocks.')) return key.slice(7,key.endsWith('.text') ? -5 : -4);
  return null;
}
