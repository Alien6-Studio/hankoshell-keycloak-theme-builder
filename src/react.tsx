"use client";
import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { getKcContextMock } from "./login/KcContext.js";
import { KeycloakPage, type KeycloakPageProps } from "./keycloak.js";
import type { ColorMode, ThemeConfig } from "./config.js";
import type { AuthenticationPage } from "./pages.js";

export interface ThemePreviewProps {
  config: ThemeConfig;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
  page?: AuthenticationPage;
  providers?: ReadonlyArray<{ alias: string; displayName: string }>;
  css?: string;
  width?: number | string;
  height?: number;
  locale?: "en" | "fr";
  renderer?: ComponentType<KeycloakPageProps>;
}

/** The real Keycloak renderer, isolated from the host application's CSS. */
export function ThemePreview({ config, mode, onModeChange, page = "login-username.ftl", providers = [], css, width = "100%", height = 600, locale = "en", renderer: Renderer = KeycloakPage }: Readonly<ThemePreviewProps>) {
  const host = useRef<HTMLDivElement>(null); const [shadow, setShadow] = useState<ShadowRoot>();
  useEffect(() => { if (host.current) setShadow(host.current.shadowRoot ?? host.current.attachShadow({ mode: "open" })); }, []);
  const context = getKcContextMock({ pageId: page, overrides: { locale: { currentLanguageTag: locale }, social: { providers: providers.map(p => ({ ...p, loginUrl: "#", providerId: p.alias })) } } });
  if (context.pageId === "frontchannel-logout.ftl") context.logout = { clients: [] };
  const { runtime: _runtime, ...draft } = config;
  return <div ref={host} data-preview-page={page} style={{ width, height, overflow: "auto", isolation: "isolate" }}>
    {shadow && createPortal(<div style={{ "--hk-page-height": `${height}px` } as CSSProperties} onSubmitCapture={event => event.preventDefault()} onClickCapture={event => { if ((event.target as Element).closest("a")) event.preventDefault(); }}>
      <Renderer key={page} kcContext={context} config={draft} mode={mode} onModeChange={onModeChange} css={css} preview />
    </div>, shadow)}
  </div>;
}
export { ThemeProvider, useTheme } from "./provider.js";
export type { ThemeProviderProps } from "./provider.js";
export { authenticationPages } from "./pages.js";
export type { AuthenticationPage } from "./pages.js";
