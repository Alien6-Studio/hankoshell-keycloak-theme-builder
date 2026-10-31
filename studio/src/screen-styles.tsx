import {useUi} from './interface-context';
import {uiMessage,type UiMessage} from './interface-locale';
import { Check } from 'lucide-react';
import { Choice, ColorControl, NumberControl, screenFonts } from './controls';
import {accentForeground,type Page} from './model';
import {directions} from './design-directions';

const palettes = [
  { name: 'Azur', accent: '#2558a1', background: '#eef3f8', surface: '#ffffff', foreground: '#192e48', muted: '#596b80', border: '#ccd7e4' },
  { name: 'Sable', accent: '#87502d', background: '#f8f3ea', surface: '#fffdf8', foreground: '#392b20', muted: '#75614f', border: '#dfd2c0' },
  { name: 'Indigo', accent: '#5145b5', background: '#f2f1fa', surface: '#ffffff', foreground: '#282344', muted: '#696280', border: '#d8d3e8' },
  { name: 'Forêt', accent: '#21664c', background: '#edf5f0', surface: '#ffffff', foreground: '#1d392d', muted: '#526e60', border: '#cadfd2' },
];

export function ScreenStyles({ page, onChange }: { page: Page; onChange: (transform: (page: Page) => Page, message?: UiMessage) => void }) {
  const ui=useUi();
  function appearance(patch: Partial<Page['appearance']>) {
    onChange(p => ({ ...p, appearance: { ...p.appearance, ...patch } }));
  }
  return <div className="screen-styles">
    <h2>{ui("Styles de l’écran")}</h2>
    <p className="secondary">{ui("Personnalisez les couleurs, la typographie et les espacements de l’écran courant.")}</p>
    <h3>{ui("Palettes de couleurs")}</h3>
    <div className="color-palettes" role="group" aria-label={ui("Palettes de couleurs")}>
      {palettes.map(palette => {
        const active = page.accent === palette.accent && page.appearance.background === palette.background && page.appearance.foreground === palette.foreground && page.appearance.surface === palette.surface && page.appearance.muted === palette.muted;
        return <button type="button" key={ui(palette.name)} className="color-palette" aria-label={ui('{name} palette',{name:ui(palette.name)})} aria-pressed={active} onClick={() => onChange(p => ({
          ...p, accent: palette.accent,
          brand: { ...p.brand, color: palette.foreground },
          appearance: { ...p.appearance, background: palette.background, surface: palette.surface, foreground: palette.foreground, muted: palette.muted },
          native: { ...p.native, background: palette.surface, foreground: palette.foreground, inputBackground: palette.surface, inputBorder: palette.border, buttonBackground: palette.accent, buttonColor: '#ffffff' },
        }), uiMessage('Palette “{name}” applied to this screen.',{name:ui(palette.name)}))}>
          <span className="color-palette-swatches" aria-hidden="true">{[palette.accent, palette.background, palette.surface, palette.foreground].map((color, index) => <i key={index} style={{ background: color }} />)}</span>
          <span className="color-palette-label">{ui(palette.name)}{active && <Check size={14} aria-hidden="true" />}</span>
        </button>;
      })}
    </div>
    <ColorControl label={ui("Accent de l’écran")} value={page.accent} onChange={accent => onChange(p => ({ ...p, accent, native: { ...p.native, buttonBackground: accent,buttonColor:accentForeground(accent) } }))} />
    <ColorControl label={ui("Fond de l’écran")} value={page.appearance.background} onChange={background => appearance({ background })} />
    <ColorControl label={ui("Texte de l’écran")} value={page.appearance.foreground} onChange={foreground => appearance({ foreground })} />
    <ColorControl label={ui("Texte secondaire de l’écran")} value={page.appearance.muted} onChange={muted => appearance({ muted })} />
    <h3>{ui("Typographie")}</h3>
    <Choice id="screen-style-font" label={ui("Police de l’écran")} value={page.appearance.font} options={screenFonts.map(option=>({...option,label:ui(option.label)}))} onChange={font => appearance({ font })} />
    <Choice id="screen-style-heading-font" label={ui("Police des titres")} value={page.appearance.headingFont||page.appearance.font} options={screenFonts.map(option=>({...option,label:ui(option.label)}))} onChange={headingFont=>appearance({headingFont})}/>
    <h3>{ui("Mise en page")}</h3>
    <Choice id="screen-style-composition" label={ui("Composition de l’écran")} value={page.appearance.composition||'free'} options={[{value:'free',label:ui('Libre')},...directions.map(direction=>({value:direction.id,label:direction.name})),{value:'card',label:ui('Carte d’accès')},{value:'workspace',label:ui('Espace de travail')},{value:'developer',label:ui('Portail développeur')},{value:'split',label:ui('Accueil partagé')},{value:'console',label:ui('Console')},{value:'editorial',label:ui('Éditoriale')},{value:'minimal',label:ui('Minimaliste')},{value:'spotlight',label:ui('Mise en lumière')}]} onChange={composition=>appearance({composition:composition==='free'?undefined:composition as Page['appearance']['composition']})}/>
    <Choice id="screen-style-field" label={ui("Présentation des champs")} value={page.native.fieldStyle||'outline'} options={[{value:'outline',label:ui('Encadrés')},{value:'underline',label:ui('Soulignés')},{value:'filled',label:ui('Fond rempli')}]} onChange={fieldStyle=>onChange(p=>({...p,native:{...p.native,fieldStyle:fieldStyle as Page['native']['fieldStyle'],inputBackground:fieldStyle==='filled'?(p.native.background===p.appearance.background?p.appearance.surface:p.appearance.background):p.native.background}}))}/>
    <Choice id="screen-style-action" label={ui("Largeur du bouton principal")} value={page.native.actionSize||'full'} options={[{value:'full',label:ui('Pleine largeur')},{value:'compact',label:ui('Compacte')}]} onChange={actionSize=>onChange(p=>({...p,native:{...p.native,actionSize:actionSize as Page['native']['actionSize']}}))}/>
    <Choice id="screen-style-layout" label={ui("Disposition de l’écran")} value={page.layout} options={[{ value: 'left', label: ui('Visuel à gauche') }, { value: 'center', label: ui('Centrée') }, { value: 'right', label: ui('Visuel à droite') }]} onChange={layout => onChange(p => ({ ...p, layout: layout as Page['layout'] }))} />
    <NumberControl label={ui("Marge intérieure de l’écran")} value={page.appearance.padding} max={80} onChange={padding => appearance({ padding })} />
    <NumberControl label={ui("Espacement des zones")} value={page.appearance.gap} max={80} onChange={gap => appearance({ gap })} />
    <NumberControl label={ui("Largeur de l’écran")} value={page.appearance.contentWidth} min={320} max={1600} step={10} onChange={contentWidth => appearance({ contentWidth })} />
    <NumberControl label={ui("Arrondis de l’écran")} value={page.radius} max={48} onChange={radius => onChange(p => ({ ...p, radius, native: { ...p.native, radius } }))} />
  </div>;
}
