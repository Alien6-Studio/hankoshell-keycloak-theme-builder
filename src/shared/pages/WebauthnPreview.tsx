import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type Props = PageProps<Extract<KcContext, { pageId: "webauthn-register.ftl" | "webauthn-authenticate.ftl" | "webauthn-error.ftl" }>, I18n>;

/** Visual preview only: never load an authenticator script into the host dashboard. */
export default function WebauthnPreview({ kcContext, i18n, Template, doUseDefaultCss }: Readonly<Props>) {
  const { msg } = i18n;
  const registration = kcContext.pageId === "webauthn-register.ftl";
  const error = kcContext.pageId === "webauthn-error.ftl";
  return <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={doUseDefaultCss} headerNode={msg(registration ? "webauthn-registration-title" : error ? "webauthn-error-title" : "webauthn-login-title")}>
    <div className="hk-form">
      {kcContext.pageId === "webauthn-authenticate.ftl" && kcContext.shouldDisplayAuthenticators && kcContext.authenticators?.authenticators.map(authenticator => <div className="hk-authenticator-item" key={authenticator.credentialId}>{authenticator.label}</div>)}
      {registration && <label className="hk-checkbox-label"><input type="checkbox" />{msg("logoutOtherSessions")}</label>}
      <button type="button" className="hk-btn" disabled>{msg(registration ? "doRegisterSecurityKey" : error ? "doTryAgain" : "webauthn-doAuthenticate")}</button>
      {kcContext.isAppInitiatedAction && <button className="hk-btn hk-btn--outline" type="button" disabled>{msg("doCancel")}</button>}
    </div>
  </Template>;
}
