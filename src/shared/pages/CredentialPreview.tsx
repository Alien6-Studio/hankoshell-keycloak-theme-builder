import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type Props = PageProps<Extract<KcContext, { pageId: "login.ftl" | "login-password.ftl" | "register.ftl" }>, I18n>;

/** Keycloakify's credential widgets query document by ID. Keep preview controls
 * local to the Shadow DOM; real authentication uses the upstream widgets. */
export default function CredentialPreview({ kcContext, i18n, Template, doUseDefaultCss }: Readonly<Props>) {
  const { msg, msgStr, advancedMsg } = i18n;
  const [showPassword, setShowPassword] = useState(false);
  const register = kcContext.pageId === "register.ftl";
  return <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={doUseDefaultCss} headerNode={msg(register ? "registerTitle" : "doLogIn")}>
    <form className="hk-form">
      {kcContext.pageId === "login.ftl" && !kcContext.usernameHidden && <label className="hk-field"><span className="hk-label">{msg("usernameOrEmail")}</span><input name="username" className="hk-input" autoComplete="username" /></label>}
      {register && Object.values(kcContext.profile.attributesByName).filter(attribute => !["password", "password-confirm"].includes(attribute.name)).map(attribute => <label className="hk-field" key={attribute.name}><span className="hk-label">{advancedMsg(attribute.displayName ?? attribute.name)}{attribute.required && " *"}</span><input className="hk-input" name={attribute.name} defaultValue={attribute.value ?? ""} readOnly={attribute.readOnly} /></label>)}
      {(!register || kcContext.passwordRequired) && <div className="hk-field"><label className="hk-label" htmlFor="password">{msg("password")}</label><div className="hk-input-wrap"><input id="password" name="password" className="hk-input hk-input--padded" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} /><button type="button" className="hk-pw-toggle" aria-label={msgStr(showPassword ? "hidePassword" : "showPassword")} onClick={() => setShowPassword(value => !value)}><i aria-hidden="true" className={`hk-password-eye${showPassword ? " hk-password-eye--hidden" : ""}`} /></button></div></div>}
      {!register && kcContext.realm.resetPasswordAllowed && <a className="hk-link" href="#">{msg("doForgotPassword")}</a>}
      <button className="hk-btn" type="submit">{msg(register ? "doRegister" : "doLogIn")}</button>
    </form>
  </Template>;
}
