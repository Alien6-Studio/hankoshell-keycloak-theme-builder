export interface FramePage {
  accent:string;radius:number;
  appearance:{background:string;surface:string;foreground:string;muted:string;font:string;headingFont?:string;padding:number;gap:number};
  native:{background:string;foreground:string;inputBorder:string;buttonBackground:string;buttonColor:string;styles?:{description?:{color?:string}}};
}
/** Palette ownership must be identical in previews, editor and portable exports. */
export function frameVariables(page:FramePage):Record<string,string>{
  const a=page.appearance,n=page.native;
  const scheme=(color:string)=>{const rgb=[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16));return rgb[0]*.299+rgb[1]*.587+rgb[2]*.114<145?'dark':'light';};
  return {
    '--bg':a.background,'--bg-surface':a.surface,'--fg':a.foreground,'--fg-secondary':a.foreground,'--fg-muted':a.muted,
    '--primary':page.accent,'--primary-action':n.buttonBackground,'--primary-foreground':n.buttonColor,'--border':n.inputBorder,
    '--hf-bg':a.background,'--hf-surface':a.surface,'--hf-fg':a.foreground,'--hf-muted':a.muted,
    '--hf-accent':page.accent,'--hf-radius':page.radius+'px','--hf-padding':a.padding+'px','--hf-gap':a.gap+'px',
    '--hf-display':a.headingFont||a.font,'--hf-scheme':scheme(a.background),
    '--hf-form-bg':n.background,'--hf-form-fg':n.foreground,'--hf-form-muted':n.styles?.description?.color||a.muted,
    '--hf-input-border':n.inputBorder,'--hf-action':n.buttonBackground,'--hf-action-fg':n.buttonColor,
    '--hf-form-scheme':scheme(n.background),
  };
}
