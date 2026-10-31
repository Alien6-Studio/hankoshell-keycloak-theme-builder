import type {Page} from './model';

type CatalogTheme = {id:string;templates:{editorPage:string;path:string}[]};

/** Gallery, editor and exports receive the same authored, independent documents. */
export function materializeThemePages(theme:CatalogTheme,templates:Record<string,unknown>):Record<string,Page> {
  return Object.fromEntries(theme.templates.map(template=>{
    const source=templates[template.path];
    if(!source)throw new Error(`Missing catalogue page: ${template.path}`);
    return [template.editorPage,structuredClone(source) as Page];
  }));
}
