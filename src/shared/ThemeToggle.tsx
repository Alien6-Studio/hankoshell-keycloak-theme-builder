import { useTheme } from "../provider.js";
export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return <button type="button" className="hk-theme-toggle" onClick={toggle} aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {mode === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></> : <path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z" />}
    </svg>
  </button>;
}
