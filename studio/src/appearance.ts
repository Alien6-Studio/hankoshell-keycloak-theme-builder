export type StudioAppearance = 'light' | 'dark' | 'system';
export const appearanceStorageKey = 'hankoshell-studio-appearance';
export function validAppearance(value: unknown): value is StudioAppearance {
  return value === 'light' || value === 'dark' || value === 'system';
}
export function readAppearance(): StudioAppearance {
  const requested = new URLSearchParams(location.search).get('scheme');
  if (validAppearance(requested)) return requested;
  try {
    const saved = localStorage.getItem(appearanceStorageKey);
    if (validAppearance(saved)) return saved;
  } catch { /* The editor also works with browser storage disabled. */ }
  return 'light';
}
