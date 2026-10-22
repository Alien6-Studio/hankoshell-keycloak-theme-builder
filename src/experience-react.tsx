"use client";
import { useEffect, useId, useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { parseExperience, type ExperienceManifest } from "./experience.js";
import { ThemeProvider, useTheme } from "./provider.js";
import { themeVariables, type ThemeConfig } from "./config.js";
import { baseCss } from "./styles.js";

export interface ExperienceContext {
  /** Opaque authenticated identity; authority is always checked by the backend. */
  subject: string;
  capabilities: readonly string[];
  locale: "en" | "fr";
}
export interface ExperienceModule<C extends ExperienceContext = ExperienceContext> {
  id: string;
  title: { en: string; fr: string };
  Component: ComponentType<{ context: C }>;
}
export interface ExperienceShellProps<C extends ExperienceContext> {
  manifest: ExperienceManifest;
  modules: readonly ExperienceModule<C>[];
  context: C;
  theme: ThemeConfig;
  page?: string;
  onNavigate?: (page: string) => void;
}

/** Both manifest metadata and implementations are build inputs, never remote scripts. */
export function ExperienceShell<C extends ExperienceContext>(props: Readonly<ExperienceShellProps<C>>) {
  const manifest = parseExperience(props.manifest);
  if (!props.context.subject) throw new Error("An authenticated experience context is required");
  if (new Set(props.modules.map(module => module.id)).size !== props.modules.length) throw new Error("Duplicate experience module");
  const [selected, setSelected] = useState(props.page);
  const allowed = manifest.surfaces.filter(surface => surface.kind !== "authentication" && surface.capabilities.every(capability => props.context.capabilities.includes(capability)));
  const visible = props.modules.filter(module => allowed.some(surface => surface.id === module.id));
  const current = visible.find(module => module.id === (props.page ?? selected)) ?? ((props.page ?? selected) === undefined ? visible[0] : undefined);
  const locale = props.context.locale;
  return <ThemeProvider config={props.theme}><ExperienceFrame>
    <nav aria-label={locale === "fr" ? "Mon espace" : "My account"} className="hk-row">{visible.map(module => <button key={module.id} type="button" className="hk-link" aria-current={module.id === current?.id ? "page" : undefined} onClick={() => { setSelected(module.id); props.onNavigate?.(module.id); }}>{module.title[locale]}</button>)}</nav>
    {current ? <section key={`${props.context.subject}:${current.id}`} aria-label={current.title[locale]}><current.Component context={props.context} /></section> : <p role="status">{locale === "fr" ? "Cet écran n’est pas disponible pour votre compte." : "This page is unavailable for your account."}</p>}
  </ExperienceFrame></ThemeProvider>;
}

function ExperienceFrame({ children }: { children: ReactNode }) {
  const { config, mode } = useTheme();
  return <div className="hk-theme" style={themeVariables(config, mode) as CSSProperties}><style>{baseCss}</style><div className="hk-page" data-mode={mode}><div className="hk-container"><main className="hk-card">{children}</main></div></div></div>;
}

export interface ProfileAttribute {
  name: string;
  label: string;
  values: readonly string[];
  required?: boolean;
  readOnly?: boolean;
  multiple?: boolean;
}
export interface PersonalProfile { subject: string; attributes: readonly ProfileAttribute[] }
export interface ProfileController {
  load(signal: AbortSignal): Promise<PersonalProfile>;
  /** The adapter binds the authenticated user; callers cannot choose another user ID. */
  save(values: Readonly<Record<string, readonly string[]>>, signal: AbortSignal): Promise<PersonalProfile>;
}
export interface ProfilePageProps { controller: ProfileController; subject: string; locale?: "en" | "fr" }

const copy = {
  fr: { title: "Mon profil", loading: "Chargement du profil…", save: "Enregistrer", saving: "Enregistrement…", saved: "Vos informations ont été enregistrées.", error: "Impossible de mettre à jour le profil. Vérifiez les champs ou réessayez.", retry: "Réessayer", cancel: "Annuler", add: "Ajouter une valeur", remove: "Supprimer la valeur" },
  en: { title: "My profile", loading: "Loading your profile…", save: "Save", saving: "Saving…", saved: "Your information has been saved.", error: "Unable to update your profile. Check the fields or try again.", retry: "Try again", cancel: "Cancel", add: "Add a value", remove: "Remove value" },
};

/** Presentation is reusable; native policy, federation and verification stay server-side. */
export function ProfilePage({ controller, subject, locale = "en" }: Readonly<ProfilePageProps>) {
  return <ProfileForm key={subject} controller={controller} subject={subject} locale={locale} />;
}

function ProfileForm({ controller, subject, locale = "en" }: Readonly<ProfilePageProps>) {
  const t = copy[locale]; const prefix = useId();
  const saving = useRef<AbortController | undefined>(undefined);
  const [profile, setProfile] = useState<PersonalProfile>();
  const [values, setValues] = useState<Record<string, readonly string[]>>({});
  const [state, setState] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const cancellation = new AbortController(); setProfile(undefined); setState("loading");
    controller.load(cancellation.signal).then(value => {
      validateProfile(value, subject);
      if (!cancellation.signal.aborted) { setProfile(value); setValues(profileValues(value)); setState("ready"); }
    }).catch(() => { if (!cancellation.signal.aborted) setState("error"); });
    return () => { cancellation.abort(); saving.current?.abort(); };
  }, [controller, subject, retry]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile || state === "saving") return;
    const cancellation = new AbortController(); saving.current = cancellation; setState("saving");
    try {
      const editable = Object.fromEntries(profile.attributes.filter(attribute => !attribute.readOnly).map(attribute => [attribute.name, values[attribute.name] ?? []]));
      const updated = await controller.save(editable, cancellation.signal); validateProfile(updated, subject);
      if (!cancellation.signal.aborted) { setProfile(updated); setValues(profileValues(updated)); setState("saved"); }
    } catch { if (!cancellation.signal.aborted) setState("error"); }
  }
  function change(name: string, next: readonly string[]) { setValues(previous => ({ ...previous, [name]: next })); if (state !== "saving") setState("ready"); }
  return <div><h1 className="hk-header">{t.title}</h1>
    {state === "loading" && <p role="status">{t.loading}</p>}
    {state === "error" && <p role="alert">{t.error} {!profile && <button type="button" className="hk-link" onClick={() => setRetry(value => value + 1)}>{t.retry}</button>}</p>}
    {state === "saved" && <p role="status">{t.saved}</p>}
    {profile && <form onSubmit={save}><fieldset disabled={state === "saving"} style={{ border: 0, padding: 0 }}>
      {profile.attributes.map(attribute => <div className="hk-field" key={attribute.name}>
        {(values[attribute.name]?.length ? values[attribute.name] : [""]).map((value, index) => <div key={index}>
          <label className="hk-label" htmlFor={`${prefix}-${attribute.name}-${index}`}>{attribute.label}{attribute.multiple ? ` ${index + 1}` : ""}{attribute.required && " *"}</label>
          <input className="hk-input" id={`${prefix}-${attribute.name}-${index}`} name={attribute.name} value={value} readOnly={attribute.readOnly} required={attribute.required} autoComplete={attribute.name === "email" ? "email" : attribute.name === "firstName" ? "given-name" : attribute.name === "lastName" ? "family-name" : "off"} onChange={event => change(attribute.name, (values[attribute.name]?.length ? values[attribute.name] : [""]).map((item, position) => position === index ? event.target.value : item))} />
          {attribute.multiple && !attribute.readOnly && index > 0 && <button type="button" className="hk-link" onClick={() => change(attribute.name, values[attribute.name].filter((_, position) => position !== index))}>{t.remove}</button>}
        </div>)}
        {attribute.multiple && !attribute.readOnly && <button type="button" className="hk-link" onClick={() => change(attribute.name, [...(values[attribute.name] ?? []), ""])}>{t.add}</button>}
      </div>)}
      <div className="hk-row"><button type="submit" className="hk-btn hk-btn-primary" disabled={profile.attributes.every(attribute => attribute.readOnly)}>{state === "saving" ? t.saving : t.save}</button><button type="button" className="hk-link" onClick={() => { setValues(profileValues(profile)); setState("ready"); }}>{t.cancel}</button></div>
    </fieldset></form>}
  </div>;
}

function profileValues(profile: PersonalProfile): Record<string, readonly string[]> { return Object.fromEntries(profile.attributes.map(attribute => [attribute.name, [...attribute.values]])); }
function validateProfile(value: PersonalProfile, subject: string) {
  if (!subject || value.subject !== subject || !Array.isArray(value.attributes) || value.attributes.length > 64) throw new Error("Profile identity mismatch");
  const names = new Set();
  for (const attribute of value.attributes) {
    if (!/^[a-zA-Z][a-zA-Z0-9._-]{0,127}$/.test(attribute.name) || names.has(attribute.name) || !Array.isArray(attribute.values) || attribute.values.some((value: unknown) => typeof value !== "string") || (!attribute.multiple && attribute.values.length > 1)) throw new Error("Invalid profile metadata");
    names.add(attribute.name);
  }
}
