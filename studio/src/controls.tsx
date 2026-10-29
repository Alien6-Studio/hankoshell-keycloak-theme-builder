import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';

export const screenFonts = [{ value: 'system-ui, sans-serif', label: 'Système · sans empattement' }, { value: 'Georgia, serif', label: 'Georgia · éditoriale' }, { value: 'Arial, sans-serif', label: 'Arial · classique' }, { value: 'Verdana, sans-serif', label: 'Verdana · lisible' }, { value: 'monospace', label: 'Monospace · technique' }];

export function Choice({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="field"><label htmlFor={id}>{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger id={id} aria-label={label}><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
}
export function NumberControl({ label, value, min = 0, max = 100, step = 1, onChange, unit = 'px' }: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  return <label className="field number-control">{label}<div><input aria-label={`${label} — curseur`} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /><Input type="number" aria-label={label} min={min} max={max} step={step} value={value} onChange={e => { if (e.target.value !== '') onChange(Math.min(max, Math.max(min, Number(e.target.value)))); }} /><span>{unit}</span></div></label>;
}
export function ColorControl({ label, value, onChange, onReset }: { label: string; value: string; onChange: (value: string) => void; onReset?: () => void }) {
  return <label className="field">{label}<span className="color-field"><input aria-label={label} type="color" value={value} onChange={e => onChange(e.target.value)} /><code>{value}</code>{onReset && <button type="button" onClick={e => { e.preventDefault(); onReset(); }} aria-label={`Réinitialiser ${label}`}>↺</button>}</span></label>;
}
