import data from '../catalog/translations.json';
import type { Block, NativePart, Page } from './model';

export type Locale = keyof typeof data.locales;
export type PageI18n = { defaultLocale: Locale; supportedLocales: Locale[]; messages: Partial<Record<Locale, Record<string, string>>>; automatic?: Partial<Record<Locale, string[]>> };
export const languages = data.locales;
export const locales = Object.keys(languages) as Locale[];
const phrases: Record<string, Partial<Record<Locale, string>>> = data.phrases;

export function resolveLocale(value: string | undefined, fallback: Locale = 'fr'): Locale {
  try { const tag = new Intl.Locale(value || fallback).toString(); if (Object.hasOwn(languages, tag)) return tag as Locale; const base = tag.split('-')[0]; if (base === 'pt') return 'pt-BR'; if (Object.hasOwn(languages, base)) return base as Locale; } catch { /* Invalid language tags use the source locale. */ }
  return fallback;
}
export function builtin(value: string, from: Locale, to: Locale): string | undefined {
  if (!value || from === to) return value;
  const row = from === 'fr' ? phrases[value] : Object.values(phrases).find(values => values[from] === value);
  return row?.[to];
}
export function textValues(page: Page): Record<string, string> {
  return { subject: page.subject, 'brand.name': page.brand.name, 'brand.alt': page.brand.alt,
    ...Object.fromEntries(Object.entries(page.native.copy).map(([key, value]) => ['native.' + key, value])),
    ...Object.fromEntries(page.blocks.flatMap(block => [[`blocks.${block.id}.text`, block.text], [`blocks.${block.id}.alt`, block.alt]])),
  };
}
function setValues(page: Page, messages: Record<string, string>): Page {
  const read = (key: string, fallback: string) => Object.hasOwn(messages,key) ? messages[key] : fallback;
  return { ...page, subject: read('subject', page.subject), brand: { ...page.brand, name: read('brand.name', page.brand.name), alt: read('brand.alt', page.brand.alt) },
    native: { ...page.native, copy: Object.fromEntries(Object.entries(page.native.copy).map(([key, value]) => [key, read('native.' + key, value)])) as Page['native']['copy'] },
    blocks: page.blocks.map(block => ({ ...block, text: read(`blocks.${block.id}.text`, block.text), alt: read(`blocks.${block.id}.alt`, block.alt) })),
  };
}
export function initializeI18n(page: Page): Page {
  if (page.i18n) return page;
  const values = textValues(page);
  const messages = Object.fromEntries(locales.filter(locale => locale !== 'fr').map(locale => [locale,
    Object.fromEntries(Object.entries(values).flatMap(([key, value]) => { const translated = builtin(value, 'fr', locale); return translated !== undefined && value ? [[key, translated]] : []; })),
  ]));
  return { ...page, i18n: { defaultLocale: 'fr', supportedLocales: [...locales], messages, automatic: Object.fromEntries(Object.entries(messages).map(([locale, values]) => [locale, Object.keys(values)])) } };
}
export function localizePage(page: Page, language: Locale): Page {
  const normalized = initializeI18n(page);
  if (language === normalized.i18n!.defaultLocale) return normalized;
  return setValues(normalized, normalized.i18n!.messages[language] || {});
}

/** Text is local to a language; structure, media and styles stay shared. */
export function mergeLocalizedPage(source: Page, before: Page, after: Page, locale: Locale): Page {
  const original = initializeI18n(source);
  const settings = original.i18n!;
  const messages = structuredClone(settings.messages);
  const automatic = structuredClone(settings.automatic || {});
  const oldStrings = textValues(before), nextStrings = textValues(after), sourceStrings = textValues(original);
  let result = after;
  if (locale !== settings.defaultLocale) {
    const edits = { ...messages[locale] };
    for (const [key, value] of Object.entries(nextStrings)) if (Object.hasOwn(sourceStrings,key) && value !== oldStrings[key]) { edits[key] = value; automatic[locale] = (automatic[locale] || []).filter(item => item !== key); }
    messages[locale] = edits;
    result = setValues(after, sourceStrings);
  } else {
    for (const [key, value] of Object.entries(nextStrings)) if (value !== sourceStrings[key]) for (const language of locales) if (automatic[language]?.includes(key)) {
      if (messages[language]) delete messages[language]![key];
      automatic[language] = automatic[language]!.filter(item => item !== key);
    }
  }
  const added = after.blocks.filter(block => !original.blocks.some(old => old.id === block.id));
  const removed = original.blocks.filter(block => !after.blocks.some(next => next.id === block.id));
  for (const block of added) {
    const oldVisible = before.blocks.find(old => old.type === block.type && old.text === block.text && old.alt === block.alt && old.src === block.src);
    const oldSource = original.blocks.find(old => old.id === oldVisible?.id);
    const text = oldSource?.text ?? builtin(block.text, locale, settings.defaultLocale) ?? block.text;
    const alt = oldSource?.alt ?? builtin(block.alt, locale, settings.defaultLocale) ?? block.alt;
    result = { ...result, blocks: result.blocks.map(next => next.id === block.id ? { ...next, text, alt } : next) };
    for (const language of settings.supportedLocales) if (language !== settings.defaultLocale) {
      const languageMessages = { ...messages[language] };
      for (const field of ['text','alt'] as const) {
        const sourceText = field === 'text' ? text : alt;
        const copied = oldSource ? settings.messages[language]?.[`blocks.${oldSource.id}.${field}`] : undefined;
        const value = copied ?? builtin(sourceText, settings.defaultLocale, language);
        if (value !== undefined && sourceText) {
          const key = `blocks.${block.id}.${field}`;
          languageMessages[key] = value;
          if (copied === undefined || (oldSource && automatic[language]?.includes(`blocks.${oldSource.id}.${field}`))) automatic[language] = [...new Set([...(automatic[language] || []), key])];
        }
      }
      messages[language] = languageMessages;
    }
  }
  for (const language of locales) if (messages[language]) for (const block of removed) for (const field of ['text','alt']) {
    const key = `blocks.${block.id}.${field}`;
    delete messages[language]![key]; automatic[language] = (automatic[language] || []).filter(item => item !== key);
  }
  return { ...result, i18n: { ...settings, messages, automatic } };
}
export function promoteLocale(page: Page, language: Locale): Page {
  const source = initializeI18n(page), settings = source.i18n!;
  if (settings.defaultLocale === language) return source;
  const next = localizePage(source, language);
  const messages = { ...settings.messages, [settings.defaultLocale]: textValues(source) };
  const automatic = { ...settings.automatic, [settings.defaultLocale]: [] };
  delete messages[language];
  delete automatic[language];
  return { ...next, i18n: { ...settings, defaultLocale: language, messages, automatic } };
}
export function translationCoverage(page: Page, locale: Locale, activeKeys?: string[]) {
  const source = initializeI18n(page), values = textValues(source), settings = source.i18n!;
  const keys = (activeKeys || Object.keys(values)).filter(key => values[key]?.trim() && key !== 'brand.name' && !key.endsWith('Example'));
  const missing = locale === settings.defaultLocale ? [] : keys.filter(key => !Object.hasOwn(settings.messages[locale] || {}, key));
  return { total: keys.length, translated: keys.length - missing.length, missing, defaultLocale: settings.defaultLocale };
}
export function selectedMessage(selected: string | null, blocks: Block[]): string | undefined {
  if (selected === '@brand') return 'brand.name';
  if (selected?.startsWith('@native:')) return 'native.' + selected.slice(8) as `native.${NativePart}`;
  const block = blocks.find(block => block.id === selected);
  return block ? `blocks.${block.id}.${block.type === 'image' ? 'alt' : 'text'}` : undefined;
}
