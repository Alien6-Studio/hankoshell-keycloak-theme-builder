import { useMemo, useState, type ComponentType } from "react";
import { ThemePreview } from "./react.js";
import { authenticationPages, type AuthenticationPage } from "./pages.js";
import type { ThemeConfig, ColorMode } from "./config.js";
import type { KeycloakPageProps } from "./keycloak.js";
import { ExperienceShell, ProfilePage, type ProfileController, type PersonalProfile } from "./experience-react.js";

const previewLocales = ["en", "fr", "es", "de", "it", "pt-BR", "ar", "he"] as const;

/** Local development gallery; never included in the production theme entry point. */
export function ThemeWorkbench({ config, css, renderer }: Readonly<{ config: ThemeConfig; css?: string; renderer?: ComponentType<KeycloakPageProps> }>) {
  const requested = new URL(location.href).searchParams.get("page");
  const [page, setPage] = useState<AuthenticationPage>(authenticationPages.find(page => page === requested) ?? "login-username.ftl");
  const [mode, setMode] = useState<ColorMode>("dark");
  const [locale, setLocale] = useState<(typeof previewLocales)[number]>("en");
  const [surface, setSurface] = useState("authentication");
  const controller = useMemo<ProfileController>(() => {
    let value: PersonalProfile = { subject: "preview-user", attributes: [
      { name: "username", label: "Username", values: ["alex"], readOnly: true },
      { name: "firstName", label: "First name", values: ["Alex"], required: true },
      { name: "lastName", label: "Last name", values: ["Example"], required: true },
      { name: "email", label: "Email", values: ["alex@example.invalid"], readOnly: true },
    ] };
    return { load: async () => structuredClone(value), save: async fields => {
      value = { ...value, attributes: value.attributes.map(attribute => ({ ...attribute, values: fields[attribute.name] ?? attribute.values })) };
      return structuredClone(value);
    } };
  }, []);
  const modules = useMemo(() => [{ id: "profile", title: { fr: "Mon profil", en: "My profile" }, Component: ({ context }: { context: { subject: string; locale: "en" | "fr" } }) => <ProfilePage controller={controller} subject={context.subject} locale={context.locale} /> }], [controller]);
  return <main style={{ fontFamily: "system-ui", background: "#e2e8f0", minHeight: "100svh" }}>
    <nav aria-label="Theme preview" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "1rem" }}>
      <label>Surface <select aria-label="Surface" value={surface} onChange={event => { setSurface(event.target.value); if (event.target.value === "self-service" && locale !== "fr" && locale !== "en") setLocale("en"); }}><option value="authentication">Authentication</option><option value="self-service">Self-service profile</option></select></label>
      <label>Page <select aria-label="Page" value={page} onChange={event => { const value = event.target.value as AuthenticationPage; setPage(value); const url = new URL(location.href); url.searchParams.set("page", value); history.replaceState(null, "", url); }}>{authenticationPages.map(id => <option key={id}>{id}</option>)}</select></label>
      <label>Appearance <select aria-label="Appearance" value={mode} onChange={event => setMode(event.target.value as ColorMode)}><option>dark</option><option>light</option></select></label>
      <label>Language <select aria-label="Language" value={locale} onChange={event => setLocale(event.target.value as (typeof previewLocales)[number])}>{(surface === "authentication" ? previewLocales : ["en", "fr"]).map(value => <option key={value}>{value}</option>)}</select></label>
    </nav>
    {surface === "authentication" ? <ThemePreview config={config} css={css} renderer={renderer} page={page} mode={mode} onModeChange={setMode} locale={locale} height={800} providers={[{ alias: "example", displayName: "Example SSO" }]} /> : <ExperienceShell theme={config} mode={mode} manifest={{ contract: "hanko.experience/v1", id: "preview", version: "1.0.0", surfaces: [{ id: "profile", kind: "self-service", capabilities: ["profile.read"] }] }} context={{ subject: "preview-user", capabilities: ["profile.read"], locale: locale === "fr" ? "fr" : "en" }} modules={modules} />}
  </main>;
}
