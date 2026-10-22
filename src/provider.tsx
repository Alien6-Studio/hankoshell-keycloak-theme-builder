"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createThemeLoader, mergeTheme, parseTheme, type ColorMode, type ThemeConfig, type ThemeLoader } from "./config.js";

const Context = createContext<{ config: ThemeConfig; mode: ColorMode; toggle: () => void } | null>(null);
export function useTheme() { const value = useContext(Context); if (!value) throw new Error("ThemeProvider is required"); return value; }

export interface ThemeProviderProps {
  config: ThemeConfig;
  children: ReactNode;
  realm?: string;
  clientId?: string;
  loader?: ThemeLoader;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
  persistMode?: boolean;
}

export function ThemeProvider({ config: input, children, realm = "", clientId, loader: customLoader, mode: controlled, onModeChange, persistMode = false }: Readonly<ThemeProviderProps>) {
  const base = useMemo(() => parseTheme(input), [input]);
  const [published, setPublished] = useState<{ base: ThemeConfig; config: ThemeConfig }>();
  const [mode, setMode] = useState<ColorMode>("dark");
  useEffect(() => {
    if (!persistMode) return;
    try { const saved = localStorage.getItem(`hanko-theme-mode:${base.name}`); if (saved === "dark" || saved === "light") setMode(saved); } catch { /* Storage can be disabled on an authentication origin. */ }
  }, [persistMode, base.name]);
  useEffect(() => {
    const loader = customLoader ?? (base.runtime ? createThemeLoader(base.runtime) : undefined);
    if (!loader) return;
    let cancelled = false; let timer: ReturnType<typeof setTimeout> | undefined; let active: AbortController | undefined;
    async function refresh() {
      active = new AbortController(); const timeout = setTimeout(() => active?.abort(), 1500);
      try { const patch = await loader!({ realm, clientId, signal: active.signal }); const config = mergeTheme(base, patch); if (!cancelled) setPublished({ base, config }); }
      catch { /* Keep the last valid appearance when publication is unavailable. */ }
      finally { clearTimeout(timeout); if (!cancelled && base.runtime?.refreshMs) timer = setTimeout(refresh, base.runtime.refreshMs); }
    }
    void refresh();
    return () => { cancelled = true; active?.abort(); clearTimeout(timer); };
  }, [base, customLoader, realm, clientId]);
  const value = { config: published?.base === base ? published.config : base, mode: controlled ?? mode, toggle: () => {
    const next = (controlled ?? mode) === "dark" ? "light" : "dark";
    setMode(next); onModeChange?.(next);
    if (persistMode) try { localStorage.setItem(`hanko-theme-mode:${base.name}`, next); } catch { /* Optional preference. */ }
  } };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
