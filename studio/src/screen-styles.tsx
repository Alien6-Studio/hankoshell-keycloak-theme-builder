import { Check } from 'lucide-react';
import { Choice, ColorControl, NumberControl, screenFonts } from './controls';
import type { Page } from './model';

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
    <ColorControl label="Accent de l’écran" value={page.accent} onChange={accent => onChange(p => ({ ...p, accent, native: { ...p.native, buttonBackground: accent } }))} />
    <ColorControl label="Fond de l’écran" value={page.appearance.background} onChange={background => appearance({ background })} />
    <ColorControl label="Texte de l’écran" value={page.appearance.foreground} onChange={foreground => appearance({ foreground })} />
    <ColorControl label="Texte secondaire de l’écran" value={page.appearance.muted} onChange={muted => appearance({ muted })} />
    <h3>Typographie</h3>
    <Choice id="screen-style-font" label="Police de l’écran" value={page.appearance.font} options={screenFonts} onChange={font => appearance({ font })} />
    <h3>Mise en page</h3>
    <Choice id="screen-style-layout" label="Disposition de l’écran" value={page.layout} options={[{ value: 'left', label: 'Visuel à gauche' }, { value: 'center', label: 'Centrée' }, { value: 'right', label: 'Visuel à droite' }]} onChange={layout => onChange(p => ({ ...p, layout: layout as Page['layout'] }))} />
    <NumberControl label="Marge intérieure de l’écran" value={page.appearance.padding} max={80} onChange={padding => appearance({ padding })} />
    <NumberControl label="Espacement des zones" value={page.appearance.gap} max={80} onChange={gap => appearance({ gap })} />
    <NumberControl label="Largeur de l’écran" value={page.appearance.contentWidth} min={320} max={1600} step={10} onChange={contentWidth => appearance({ contentWidth })} />
    <NumberControl label="Arrondis de l’écran" value={page.radius} max={48} onChange={radius => onChange(p => ({ ...p, radius, native: { ...p.native, radius } }))} />
  </div>;
}
