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
    if (!theme.baseTheme) return [template.editorPage, page];
    const result = stylePage(page, theme.style);
    const composition = theme.style.composition;
    const family = template.editorPage.split(':')[0];
    if (composition && family === 'login') {
      const compact = ['card', 'developer', 'minimal'].includes(composition);
      const removed = new Set<string>();
      if (compact) {
        result.blocks = result.blocks.filter(block => {
          if (block.zone === 'header' || block.zone === 'aside') { removed.add(block.id); return false; }
          return true;
        });
        result.layout = 'center';
        result.brand.align = composition === 'card' ? 'left' : 'center';
        result.brand.size = composition === 'developer' ? 42 : 30;
        result.brand.fontSize = 20;
        result.appearance.contentWidth = composition === 'card' ? 460 : composition==='developer'?380:400;
        result.appearance.padding = composition === 'card' ? 40 : 24;
        result.native.padding = composition === 'developer' ? 24 : 0;
        result.native.gap = 18;
        if (composition === 'minimal') result.native.background = result.appearance.background;
      } else {
        result.brand.align = 'left';
        result.brand.size = 30; result.brand.fontSize = 18;
        if (composition === 'console') result.layout = 'left';
        result.appearance.contentWidth = composition === 'workspace' ? 1040 : 1120;
        result.appearance.padding = 40;
        result.appearance.gap = 28;
        result.native.padding = composition === 'workspace' ? 16 : 30;
        result.native.gap = 18;
        for (const block of result.blocks) {
          if (block.type === 'heading') block.style = {...block.style, fontSize: composition === 'console' ? 30 : 46, fontWeight: 500};
          if (block.type === 'image') {
            if (composition === 'workspace' || composition === 'console') {
              block.type = 'text'; delete block.src; block.text = result.native.copy.description; block.alt = '';
              block.style = {fontSize: 15, lineHeight: 1.7};
              for (const messages of Object.values(result.i18n!.messages)) {
                if (!messages) continue;
                messages[`blocks.${block.id}.text`] = messages['native.description'] || block.text;
                delete messages[`blocks.${block.id}.alt`];
              }
            } else block.style = {...block.style, imageHeight: 250, fit: 'contain'};
          }
        }
        if (composition === 'spotlight') {
          result.native.background = result.native.inputBackground = '#ffffff';
          result.native.foreground = '#1e293b'; result.native.inputBorder = '#a6b1c1';
          result.native.styles.description = {color: '#526175', fontSize: 14, lineHeight: 1.6};
        }
      }
      for (const messages of Object.values(result.i18n!.messages)) {
        if (!messages) continue;
        for (const key of Object.keys(messages)) if ([...removed].some(id => key.startsWith(`blocks.${id}.`))) delete messages[key];
      }
      if(result.i18n?.automatic)for(const language of Object.keys(result.i18n.automatic) as (keyof typeof result.i18n.automatic)[]){result.i18n.automatic[language]=result.i18n.automatic[language]?.filter(key=>![...removed].some(id=>key.startsWith(`blocks.${id}.`)));}
      if(result.native.fieldStyle==='filled')result.native.inputBackground=composition==='minimal'?result.appearance.surface:result.appearance.background;
      for(const part of ['username','password','email','name','otp'] as const){
        result.native.styles[`${part}Label`]={fontSize:13,fontWeight:500,color:result.native.foreground};
        result.native.styles[`${part}Example`]={fontSize:14,padding:12,radius:result.native.fieldStyle==='underline'?0:Math.min(result.radius,12)};
      }
      result.native.styles.title = {fontSize: composition === 'workspace' ? 24 : 26, fontWeight: 500};
    }
    if (family === 'email') { delete result.appearance.composition; result.layout = 'center'; }
    return [template.editorPage, result];
  }));
}
