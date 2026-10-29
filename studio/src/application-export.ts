import type { Page } from './model';

/** Application code consumes the headless SDK and the host's UI components. */
export function applicationSource(page: Page): string {
  return `"use client";
import type { CSSProperties, ReactNode } from "react";
import type { HankoIdentityController } from "@alien6/hankoshell-typescript-adk/identity";
import { HankoIdentityScreen, useHankoAccount, hankoIdentityMessages, resolveHankoIdentityLocale, hankoIdentityDirection, type HankoIdentityUI, type HankoAccountAction } from "@alien6/hankoshell-typescript-adk/identity/react";

export const appearance = ${JSON.stringify({ brand: page.brand, appearance: page.appearance, accent: page.accent, radius: page.radius }, null, 2)} as const;
export const localization: { defaultLocale: string; supportedLocales: readonly string[]; messages: Partial<Record<string, Record<string, string>>>; automatic?: Partial<Record<string, readonly string[]>> } = ${JSON.stringify(page.i18n || { defaultLocale: 'fr', supportedLocales: ['fr'], messages: {} }, null, 2)};
const logo = (appearance.brand as { logo?: string }).logo || "";
export interface IdentityScreenProps {
  /** Authenticated subject supplied by the host application. */
  subject: string;
  /** Authenticated application controller; keep its instance stable. */
  controller: HankoIdentityController;
  /** The application's design-system adapter, for example shadcn/ui. */
  ui: HankoIdentityUI;
  locale?: string;
  onAccountAction?: (action: HankoAccountAction) => void | Promise<void>;
}

export function IdentityTheme({ children, locale }: { children: ReactNode; locale?: string }) {
  const language = resolveHankoIdentityLocale(locale || localization.defaultLocale);
  const messages = localization.messages[language] || {};
  const a = appearance.appearance;
  const variables = {
    "--bg": a.background, "--background": a.background,
    "--bg-surface": a.surface, "--card": a.surface,
    "--fg": a.foreground, "--foreground": a.foreground,
    "--fg-muted": a.muted, "--muted-foreground": a.muted,
    "--primary": appearance.accent, "--primary-action": appearance.accent,
    "--radius": appearance.radius + "px",
    background: a.background, color: a.foreground, fontFamily: a.font,
    padding: a.padding, maxWidth: a.contentWidth, marginInline: "auto",
  } as CSSProperties;
  return <div style={variables} lang={language} dir={hankoIdentityDirection(language)}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24,justifyContent:appearance.brand.align === "center" ? "center" : appearance.brand.align === "right" ? "flex-end" : "flex-start",color:appearance.brand.color,fontSize:appearance.brand.fontSize}}>
      {logo ? <img src={logo} alt={messages["brand.alt"] ?? appearance.brand.alt} style={{height:appearance.brand.size,maxWidth:180,objectFit:"contain"}} /> : <span style={{display:"grid",placeItems:"center",width:appearance.brand.size,height:appearance.brand.size,background:appearance.accent,color:"white",borderRadius:6}}>{appearance.brand.mark}</span>}
      <span>{messages["brand.name"] ?? appearance.brand.name}</span>
    </div>
    {children}
  </div>;
}

/** The SDK enforces the account/controller contracts and exposes only permitted actions. */
export function ProfileScreen(props: IdentityScreenProps) {
  return <IdentityTheme locale={props.locale}><HankoIdentityScreen {...props} page="profile" locale={resolveHankoIdentityLocale(props.locale || localization.defaultLocale)} /></IdentityTheme>;
}
export function OrganizationsScreen(props: IdentityScreenProps) {
  return <IdentityTheme locale={props.locale}><HankoIdentityScreen {...props} page="organizations" locale={resolveHankoIdentityLocale(props.locale || localization.defaultLocale)} /></IdentityTheme>;
}
export function SecurityScreen(props: IdentityScreenProps) {
  return <IdentityTheme locale={props.locale}><HankoIdentityScreen {...props} page="security" locale={resolveHankoIdentityLocale(props.locale || localization.defaultLocale)} /></IdentityTheme>;
}
export function AccessScreen(props: IdentityScreenProps) {
  return <IdentityTheme locale={props.locale}><HankoIdentityScreen {...props} page="access" locale={resolveHankoIdentityLocale(props.locale || localization.defaultLocale)} /></IdentityTheme>;
}

/** Read-only resource and access views; administrative policy changes belong in the host backend. */
function AccountValues(props: IdentityScreenProps & { kind: "resources" | "permissions" }) {
  const account = useHankoAccount(props.subject, props.controller);
  const ui = props.ui;
  const locale = resolveHankoIdentityLocale(props.locale || localization.defaultLocale);
  const t = hankoIdentityMessages[locale];
  if (!account.data) return <IdentityTheme locale={props.locale}><ui.Status role={account.error ? "alert" : "status"} kind={account.error ? "error" : "loading"}>{account.error ? t.unavailable : t.loading}{account.error && <ui.Button onClick={account.reload}>{t.retry}</ui.Button>}</ui.Status></IdentityTheme>;
  const resources = account.data.resources || [];
  const items = props.kind === "resources"
    ? resources.map(resource => ({label:resource.name,value:resource.scopes.join(", ")}))
    : [...account.data.roles.map(role => ({label:t.role,value:role})), ...resources.flatMap(resource => resource.scopes.map(scope => ({label:resource.name,value:scope})))];
  const title = props.kind === "resources" ? t.resources : t.access;
  return <IdentityTheme locale={props.locale}><ui.Page title={title}><ui.Section>{items.length ? <ui.Values items={items} /> : <ui.Status role="status" kind="empty">{t.noRoles}</ui.Status>}</ui.Section></ui.Page></IdentityTheme>;
}
export function ResourcesScreen(props: IdentityScreenProps) { return <AccountValues {...props} kind="resources" />; }
export function PermissionsScreen(props: IdentityScreenProps) { return <AccountValues {...props} kind="permissions" />; }
`;
}
