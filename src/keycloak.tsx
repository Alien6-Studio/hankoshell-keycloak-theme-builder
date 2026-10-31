"use client";
import type { KcContext } from "keycloakify/login/KcContext";
import KcPage from "./login/KcPage.js";
import { ThemeProvider, type ThemeProviderProps, useTheme } from "./provider.js";
import { ThemeContext } from "./shared/ThemeContext.js";
import { PresentationContext } from "./presentation.js";
import { CompositionContext } from "./composition-model.js";
import type { StudioComposition } from "./composition-types.js";

export interface KeycloakPageProps extends Omit<ThemeProviderProps, "children" | "realm" | "clientId"> { kcContext: KcContext; css?: string; preview?: boolean; composition?: StudioComposition }
function Page({ kcContext }: Readonly<{ kcContext: KcContext }>) {
  const { config } = useTheme();
  return <ThemeContext.Provider value={{ social_position: config.socialPosition }}><KcPage kcContext={kcContext} /></ThemeContext.Provider>;
}
export function KeycloakPage({ kcContext, css, preview, composition, ...props }: Readonly<KeycloakPageProps>) {
  return <ThemeProvider {...props} realm={kcContext.realm.name} clientId={kcContext.client?.clientId}>
    <PresentationContext.Provider value={{ css, preview }}><CompositionContext.Provider value={composition}><Page kcContext={kcContext} /></CompositionContext.Provider></PresentationContext.Provider>
  </ThemeProvider>;
}
export type { KcContext };
