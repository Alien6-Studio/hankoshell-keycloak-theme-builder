export type StudioAppearance = 'light' | 'dark' | 'system';
export const appearanceStorageKey = 'hankoshell-studio-appearance';
export function parseAppearance(value: unknown): StudioAppearance | undefined {
  switch (value) {
    case 'light': return 'light';
    case 'dark': return 'dark';
    case 'system': return 'system';
    default: return undefined;
  }
}
export function readAppearance(): StudioAppearance {
  const requested = parseAppearance(new URLSearchParams(location.search).get('scheme'));
  if (requested) return requested;
  try {
    const saved = parseAppearance(localStorage.getItem(appearanceStorageKey));
    if (saved) return saved;
  } catch { /* The editor also works with browser storage disabled. */ }
  return 'light';
}
