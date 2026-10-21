import { i18nBuilder } from "keycloakify/login";

export const { useI18n, ofTypeI18n } = i18nBuilder.build();

export type I18n = typeof ofTypeI18n;
