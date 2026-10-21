import type { KcContext } from "keycloakify/login/KcContext";

/** Pages exposed by the builder and dashboard preview. Other native pages use the same styled fallback. */
export const authenticationPages = [
  "login.ftl", "login-username.ftl", "login-password.ftl", "register.ftl",
  "login-otp.ftl", "login-config-totp.ftl", "login-reset-otp.ftl", "select-authenticator.ftl",
  "login-recovery-authn-code-config.ftl", "login-recovery-authn-code-input.ftl",
  "webauthn-authenticate.ftl", "webauthn-register.ftl", "webauthn-error.ftl",
  "login-reset-password.ftl", "login-update-password.ftl", "login-verify-email.ftl",
  "logout-confirm.ftl", "frontchannel-logout.ftl", "info.ftl", "error.ftl", "login-page-expired.ftl",
] as const satisfies readonly KcContext["pageId"][];
export type AuthenticationPage = (typeof authenticationPages)[number];
