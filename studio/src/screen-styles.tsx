import { Check } from 'lucide-react';
import { Choice, ColorControl, NumberControl, screenFonts } from './controls';
import {accentForeground,type Page} from './model';

const palettes = [
  { name: 'Azur', accent: '#2558a1', background: '#eef3f8', surface: '#ffffff', foreground: '#192e48', muted: '#596b80', border: '#ccd7e4' },
  { name: 'Sable', accent: '#87502d', background: '#f8f3ea', surface: '#fffdf8', foreground: '#392b20', muted: '#75614f', border: '#dfd2c0' },
  { name: 'Indigo', accent: '#5145b5', background: '#f2f1fa', surface: '#ffffff', foreground: '#282344', muted: '#696280', border: '#d8d3e8' },
  { name: 'Forêt', accent: '#21664c', background: '#edf5f0', surface: '#ffffff', foreground: '#1d392d', muted: '#526e60', border: '#cadfd2' },
];

export function ScreenStyles({ page, onChange }: { page: Page; onChange: (transform: (page: Page) => Page, message?: string) => void }) {
  function appearance(patch: Partial<Page['appearance']>) {
    onChange(p => ({ ...p, appearance: { ...p.appearance, ...patch } }));
  }
  return <div className="screen-styles">
    <h2>Styles de l’écran</h2>
    <p className="secondary">Personnalisez les couleurs, la typographie et les espacements de l’écran courant.</p>
    <h3>Palettes de couleurs</h3>
    <div className="color-palettes" role="group" aria-label="Palettes de couleurs">
      {palettes.map(palette => {
        const active = page.accent === palette.accent && page.appearance.background === palette.background && page.appearance.foreground === palette.foreground && page.appearance.surface === palette.surface && page.appearance.muted === palette.muted;
        return <button type="button" key={palette.name} className="color-palette" aria-label={`Palette ${palette.name}`} aria-pressed={active} onClick={() => onChange(p => ({
          ...p, accent: palette.accent,
          brand: { ...p.brand, color: palette.foreground },
          appearance: { ...p.appearance, background: palette.background, surface: palette.surface, foreground: palette.foreground, muted: palette.muted },
          native: { ...p.native, background: palette.surface, foreground: palette.foreground, inputBackground: palette.surface, inputBorder: palette.border, buttonBackground: palette.accent, buttonColor: '#ffffff' },
        }), `Palette « ${palette.name} » appliquée à cet écran.`)}>
          <span className="color-palette-swatches" aria-hidden="true">{[palette.accent, palette.background, palette.surface, palette.foreground].map((color, index) => <i key={index} style={{ background: color }} />)}</span>
          <span className="color-palette-label">{palette.name}{active && <Check size={14} aria-hidden="true" />}</span>
        </button>;
      })}
    </div>
    <ColorControl label="Accent de l’écran" value={page.accent} onChange={accent => onChange(p => ({ ...p, accent, native: { ...p.native, buttonBackground: accent,buttonColor:accentForeground(accent) } }))} />
    <ColorControl label="Fond de l’écran" value={page.appearance.background} onChange={background => appearance({ background })} />
    <ColorControl label="Texte de l’écran" value={page.appearance.foreground} onChange={foreground => appearance({ foreground })} />
    <ColorControl label="Texte secondaire de l’écran" value={page.appearance.muted} onChange={muted => appearance({ muted })} />
    <h3>Typographie</h3>
    <Choice id="screen-style-font" label="Police de l’écran" value={page.appearance.font} options={screenFonts} onChange={font => appearance({ font })} />
    <h3>Mise en page</h3>
    <Choice id="screen-style-composition" label="Composition de l’écran" value={page.appearance.composition||'free'} options={[{value:'free',label:'Libre'},{value:'card',label:'Carte d’accès'},{value:'workspace',label:'Espace de travail'},{value:'developer',label:'Portail développeur'},{value:'split',label:'Accueil partagé'},{value:'console',label:'Console'},{value:'editorial',label:'Éditoriale'},{value:'minimal',label:'Minimaliste'},{value:'spotlight',label:'Mise en lumière'}]} onChange={composition=>appearance({composition:composition==='free'?undefined:composition as Page['appearance']['composition']})}/>
    <Choice id="screen-style-field" label="Présentation des champs" value={page.native.fieldStyle||'outline'} options={[{value:'outline',label:'Encadrés'},{value:'underline',label:'Soulignés'},{value:'filled',label:'Fond rempli'}]} onChange={fieldStyle=>onChange(p=>({...p,native:{...p.native,fieldStyle:fieldStyle as Page['native']['fieldStyle'],inputBackground:fieldStyle==='filled'?(p.native.background===p.appearance.background?p.appearance.surface:p.appearance.background):p.native.background}}))}/>
    <Choice id="screen-style-action" label="Largeur du bouton principal" value={page.native.actionSize||'full'} options={[{value:'full',label:'Pleine largeur'},{value:'compact',label:'Compacte'}]} onChange={actionSize=>onChange(p=>({...p,native:{...p.native,actionSize:actionSize as Page['native']['actionSize']}}))}/>
    <Choice id="screen-style-layout" label="Disposition de l’écran" value={page.layout} options={[{ value: 'left', label: 'Visuel à gauche' }, { value: 'center', label: 'Centrée' }, { value: 'right', label: 'Visuel à droite' }]} onChange={layout => onChange(p => ({ ...p, layout: layout as Page['layout'] }))} />
    <NumberControl label="Marge intérieure de l’écran" value={page.appearance.padding} max={80} onChange={padding => appearance({ padding })} />
    <NumberControl label="Espacement des zones" value={page.appearance.gap} max={80} onChange={gap => appearance({ gap })} />
    <NumberControl label="Largeur de l’écran" value={page.appearance.contentWidth} min={320} max={1600} step={10} onChange={contentWidth => appearance({ contentWidth })} />
    <NumberControl label="Arrondis de l’écran" value={page.radius} max={48} onChange={radius => onChange(p => ({ ...p, radius, native: { ...p.native, radius } }))} />
  </div>;
}
