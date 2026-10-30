import {stylePage, type Page, type Preset} from './model';

type CatalogTheme = {
  id: string;
  baseTheme?: string;
  style: Preset;
  templates: {editorPage: string; path: string}[];
};

/** Resolve shared screen documents into an independent, editable project. */
export function materializeThemePages(theme: CatalogTheme, templates: Record<string, unknown>): Record<string, Page> {
  return Object.fromEntries(theme.templates.map(template => {
    const source = templates[template.path];
    if (!source) throw new Error(`Missing catalogue page: ${template.path}`);
    const page = structuredClone(source) as Page;
    return [template.editorPage, theme.baseTheme ? stylePage(page, theme.style) : page];
  }));
}
