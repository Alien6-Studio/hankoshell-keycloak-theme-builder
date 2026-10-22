export type ColorMode = "dark" | "light";
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface Palette {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  card: string;
  muted: string;
  border: string;
  input: string;
}

export interface ThemeConfig {
  version: 1;
  name: string;
  headline?: string;
  subline?: string;
  logoUrl?: string;
  fontFamily?: string;
  colors?: { dark?: Partial<Palette>; light?: Partial<Palette> };
  layout?: { cardRadius?: string; controlRadius?: string; contentWidth?: string };
  socialPosition?: "before" | "after";
  runtime?: { endpoint: string; refreshMs?: number };
  /** Presentation data for compiled modules; never code, permissions or endpoints. */
  modules?: Record<string, Record<string, JsonValue>>;
}

export type ThemePatch = Omit<Partial<ThemeConfig>, "version" | "name" | "runtime">;
export interface AppearanceProfile { contract: "hanko.appearance/v1"; revision: string; appearance: ThemePatch }
export interface ThemeRequest { realm: string; clientId?: string; signal: AbortSignal }
export type ThemeLoader = (request: ThemeRequest) => Promise<ThemePatch>;

const palettes: Record<ColorMode, Palette> = {
  dark: { background: "#0b1220", foreground: "#f1f5f9", primary: "#2563eb", primaryForeground: "#ffffff", card: "#151e2e", muted: "#a6b2c5", border: "#334155", input: "#111b2a" },
  light: { background: "#fafafa", foreground: "#0f172a", primary: "#2563eb", primaryForeground: "#ffffff", card: "#ffffff", muted: "#475569", border: "#cbd5e1", input: "#ffffff" },
};
const paletteKeys = Object.keys(palettes.dark);
const keys = ["version", "name", "headline", "subline", "logoUrl", "fontFamily", "colors", "layout", "socialPosition", "runtime", "modules"];

function object(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error(`${label} must be an object`);
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${label} must be a plain object`);
  return input as Record<string, unknown>;
}
function only(input: Record<string, unknown>, allowed: string[], label: string) {
  for (const key of Object.keys(input)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} property: ${key}`);
}
function text(value: unknown, label: string, max = 256): asserts value is string {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u001f]/.test(value)) throw new Error(`Invalid ${label}`);
}
function color(value: unknown): asserts value is string {
  text(value, "color", 256);
  if (!/^(?:#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|transparent|white|black|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|color-mix)\([\da-z .,%()+\/-]+\))$/i.test(value)) throw new Error("Invalid CSS color");
}
function length(value: unknown) {
  text(value, "layout length", 24);
  if (!/^(?:0|\d+(?:\.\d+)?(?:px|rem))$/.test(value)) throw new Error("Use px or rem for layout lengths");
}

/** Validate network data before it reaches CSS, asset URLs or a renderer. */
export function parseTheme(input: unknown): ThemeConfig {
  const value = object(input, "Theme"); only(value, keys, "theme");
  if (value.version !== 1 || typeof value.name !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(value.name)) throw new Error("A version-1 theme with a valid name is required");
  for (const key of ["headline", "subline"] as const) if (value[key] !== undefined) text(value[key], key, key === "subline" ? 512 : 256);
  if (value.fontFamily !== undefined) {
    text(value.fontFamily, "font family");
    if (!/^[\w ,'".-]+$/.test(value.fontFamily as string)) throw new Error("Invalid font family");
  }
  if (value.logoUrl !== undefined) {
    text(value.logoUrl, "logo URL", 512 * 1024);
    const url = value.logoUrl as string;
    if (url.includes("\\")) throw new Error("Logo URLs cannot contain backslashes");
    if (url && !/^(?:https:\/\/[^\s]+|\/(?!\/)[^\s]*|data:image\/(?:svg\+xml|png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(url)) throw new Error("Use a same-origin path, HTTPS logo or an embedded image");
    if (url.startsWith("https:")) { const parsed = new URL(url); if (parsed.username || parsed.password) throw new Error("Logo URL credentials are forbidden"); }
  }
  if (value.colors !== undefined) {
    const modes = object(value.colors, "Colors"); only(modes, ["dark", "light"], "colors");
    for (const item of Object.values(modes)) { const palette = object(item, "Palette"); only(palette, paletteKeys, "palette"); for (const c of Object.values(palette)) color(c); }
  }
  if (value.layout !== undefined) { const layout = object(value.layout, "Layout"); only(layout, ["cardRadius", "controlRadius", "contentWidth"], "layout"); for (const item of Object.values(layout)) length(item); }
  if (value.socialPosition !== undefined && value.socialPosition !== "before" && value.socialPosition !== "after") throw new Error("Invalid social position");
  if (value.modules !== undefined) {
    const modules = object(value.modules, "Module settings");
    for (const [id, settings] of Object.entries(modules)) {
      if (!/^[a-z][a-z0-9._-]{0,127}$/.test(id)) throw new Error("Invalid module identifier");
      moduleData(object(settings, "Module settings"), 0);
    }
    if (Object.keys(modules).length > 64 || new TextEncoder().encode(JSON.stringify(modules)).byteLength > 65536) throw new Error("Module settings are too large");
  }
  if (value.runtime !== undefined) {
    const runtime = object(value.runtime, "Runtime"); only(runtime, ["endpoint", "refreshMs"], "runtime");
    text(runtime.endpoint, "runtime endpoint", 2048);
    if (!/^\/(?!\/)[^\s\\]*$/.test(runtime.endpoint as string)) throw new Error("Runtime branding must use a same-origin endpoint");
    if (runtime.refreshMs !== undefined && (!Number.isInteger(runtime.refreshMs) || Number(runtime.refreshMs) < 1000 || Number(runtime.refreshMs) > 3600000)) throw new Error("Refresh interval must be between 1 second and 1 hour");
  }
  return structuredClone(value) as unknown as ThemeConfig;
}

function moduleData(value: unknown, depth: number): void {
  if (depth > 8) throw new Error("Module settings are too deeply nested");
  if (value === null || typeof value === "boolean" || typeof value === "string") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  const entries = Array.isArray(value) ? value : Object.values(object(value, "Module data"));
  if (entries.length > 64 || (!Array.isArray(value) && Object.keys(value as object).some(key => ["__proto__", "prototype", "constructor"].includes(key)))) throw new Error("Invalid module data");
  for (const item of entries) moduleData(item, depth + 1);
}

export function mergeTheme(base: ThemeConfig, patch: ThemePatch): ThemeConfig {
  const fields = object(patch, "Theme patch");
  only(fields, keys.filter(key => !["version", "name", "runtime"].includes(key)), "theme patch");
  return parseTheme({ ...base, ...fields, colors: { dark: { ...base.colors?.dark, ...patch.colors?.dark }, light: { ...base.colors?.light, ...patch.colors?.light } }, layout: { ...base.layout, ...patch.layout } });
}

export function parseAppearance(input: unknown): AppearanceProfile {
  const value = object(input, "Appearance profile"); only(value, ["contract", "revision", "appearance"], "appearance profile");
  if (value.contract !== "hanko.appearance/v1" || typeof value.revision !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(value.revision)) throw new Error("Unsupported appearance contract");
  const validated = mergeTheme({ version: 1, name: "profile" }, object(value.appearance, "Appearance") as ThemePatch);
  const { name: _name, version: _version, ...patch } = validated;
  return { contract: "hanko.appearance/v1", revision: value.revision, appearance: patch };
}

export function themeVariables(config: ThemeConfig, mode: ColorMode): Record<string, string> {
  const p = { ...palettes[mode], ...config.colors?.[mode] };
  if (config.colors?.[mode]?.background || config.colors?.[mode]?.foreground) {
    const overrides = config.colors[mode];
    p.card = overrides?.card ?? `color-mix(in oklch, ${p.background} 93%, ${p.foreground} 7%)`;
    p.muted = overrides?.muted ?? `color-mix(in oklch, ${p.foreground} 47%, ${p.background} 53%)`;
    p.border = overrides?.border ?? `color-mix(in oklch, ${p.background} 80%, ${p.foreground} 20%)`;
    p.input = overrides?.input ?? `color-mix(in oklch, ${p.background} 96%, ${p.foreground} 4%)`;
  }
  return { "--bg": p.background, "--bg-card": p.card, "--fg": p.foreground, "--fg-muted": p.muted, "--primary": p.primary, "--primary-fg": p.primaryForeground, "--border": p.border, "--input-bg": p.input, "--ring": p.primary, "--ring-glow": `color-mix(in oklch, ${p.primary} 18%, transparent)`, "--font-family": config.fontFamily ?? "system-ui, sans-serif", "--card-radius": config.layout?.cardRadius ?? "0", "--control-radius": config.layout?.controlRadius ?? "0", "--content-width": config.layout?.contentWidth ?? "384px", "--card-shadow": "none" };
}

/** Public appearance only. Authentication and publication decisions stay with the host. */
export function createThemeLoader(runtime: NonNullable<ThemeConfig["runtime"]>, fetcher: typeof fetch = fetch): ThemeLoader {
  runtime = parseTheme({ version: 1, name: "runtime", runtime }).runtime!;
  return async ({ realm, clientId, signal }) => {
    const endpoint = runtime.endpoint.replaceAll("{realm}", encodeURIComponent(realm)).replaceAll("{clientId}", encodeURIComponent(clientId ?? ""));
    if (!endpoint.startsWith("/") || endpoint.startsWith("//")) throw new Error("Invalid runtime endpoint");
    const response = await fetcher(endpoint, { signal, credentials: "omit", cache: "no-store", redirect: "error" });
    if (!response.ok) throw new Error("Branding is unavailable");
    if (Number(response.headers.get("content-length")) > 768 * 1024) throw new Error("Branding response is too large");
    let content = ""; let size = 0;
    if (response.body) {
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      try { while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 768 * 1024) throw new Error("Branding response is too large"); content += decoder.decode(chunk.value, { stream: true }); } content += decoder.decode(); }
      finally { await reader.cancel(); reader.releaseLock(); }
    }
    const payload = JSON.parse(content);
    if (payload?.contract === "hanko.appearance/v1") return parseAppearance(payload).appearance;
    const config = parseTheme(payload);
    const { version: _version, name: _name, runtime: _runtime, ...patch } = config;
    return patch;
  };
}
