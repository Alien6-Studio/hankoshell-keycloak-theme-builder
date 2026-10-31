import { createContext, useContext } from "react";
import type { I18n } from "./login/i18n.js";
import type { StudioComposition } from "./composition-types.js";

export const CompositionContext = createContext<StudioComposition | undefined>(undefined);
export const useComposition = () => useContext(CompositionContext);
export function compositionPage(project: StudioComposition, pageId: string, language: string) {
  const key = pageId === "register.ftl" ? "login:1" : pageId === "login-otp.ftl" ? "login:2" : "login:0";
  const source = project.pages[key] || project.pages["login:0"]!;
  const locale = source.i18n?.supportedLocales.find(value => value === language) || source.i18n?.supportedLocales.find(value => value.split("-")[0] === language.split("-")[0]) || source.i18n?.defaultLocale || "fr";
  const messages = locale === source.i18n?.defaultLocale ? {} : source.i18n?.messages[locale] || {};
  const read = (key: string, value: string) => messages[key] ?? value;
  return { ...source, brand: { ...source.brand, name: read("brand.name", source.brand.name), alt: read("brand.alt", source.brand.alt) },
    native: { ...source.native, copy: Object.fromEntries(Object.entries(source.native.copy).map(([key, value]) => [key, read("native." + key, value)])) },
    blocks: source.blocks.map(block => ({ ...block, text: read(`blocks.${block.id}.text`, block.text), alt: read(`blocks.${block.id}.alt`, block.alt) })),
  };
}
export const nativePages = new Set(["login.ftl", "login-username.ftl", "login-password.ftl", "register.ftl", "login-otp.ftl"]);
export function compositionI18n(i18n: I18n, pageId: string, project?: StudioComposition): I18n {
  if (!project || !nativePages.has(pageId)) return i18n;
  const page = compositionPage(project, pageId, i18n.currentLanguage.languageTag);
  const fields: Record<string, string> = { username: "usernameLabel", usernameOrEmail: "usernameLabel", email: pageId === "register.ftl" ? "emailLabel" : "usernameLabel", password: "passwordLabel", loginOtpOneTime: "otpLabel" };
  fields[pageId === "register.ftl" ? "doRegister" : "doLogIn"] = "action";
  if (pageId === "login-otp.ftl") fields.doSubmit = "action";
  return new Proxy(i18n, { get(target, key, receiver) {
    const original = Reflect.get(target, key, receiver);
    if (!["msg", "msgStr", "advancedMsg", "advancedMsgStr"].includes(String(key))) return original;
    return (message: string, ...args: unknown[]) => {
      const token = String(key).startsWith("advanced") ? /^\$\{([a-zA-Z][a-zA-Z0-9]*)\}$/.exec(message)?.[1] ?? message : message;
      const field = fields[token];
      if (!field || !page.native.copy[field]) return Reflect.apply(original, target, [message, ...args]);
      const value = page.native.copy[field];
      return String(key).endsWith("Str") ? value : <span>{value}</span>;
    };
  } });
}
