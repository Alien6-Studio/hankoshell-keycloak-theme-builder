import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";
import { usePresentation } from "../../presentation.js";

type Props = PageProps<Extract<KcContext, { pageId: "login-recovery-authn-code-config.ftl" }>, I18n>;

/** Codes are generated and consumed by Keycloak; the theme only displays them. */
export default function RecoveryCodes({ kcContext, i18n, Template, doUseDefaultCss }: Readonly<Props>) {
  const { recoveryAuthnCodesConfigBean: codes, url, isAppInitiatedAction } = kcContext;
  const { msg, msgStr } = i18n;
  const { preview } = usePresentation();
  const [confirmed, setConfirmed] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const lines = codes.generatedRecoveryAuthnCodesList.map((code, index) => `${index + 1}: ${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`);
  const text = `${msgStr("recovery-codes-download-file-header")}\n\n${lines.join("\n")}\n\n${msgStr("recovery-codes-download-file-description")}`;

  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopyFailed(false); }
    catch { setCopyFailed(true); }
  }
  function download() {
    const href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = href; link.download = "recovery-codes.txt";
    link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  function print() {
    const page = window.open("", "_blank", "popup,width=640,height=720");
    if (!page) return;
    page.opener = null;
    const body = page.document.createElement("pre"); body.textContent = text;
    body.style.whiteSpace = "pre-wrap"; page.document.body.append(body);
    page.document.title = msgStr("recovery-codes-download-file-header");
    page.addEventListener("afterprint", () => page.close(), { once: true }); page.print();
  }
  return <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={doUseDefaultCss} headerNode={msg("recovery-code-config-header")}>
    <div className="hk-alert hk-alert--warning"><strong>{msg("recovery-code-config-warning-title")}</strong><p>{msg("recovery-code-config-warning-message")}</p></div>
    <ol id="kc-recovery-codes-list" className="hk-recovery-codes">{lines.map((line, index) => <li key={index}>{line}</li>)}</ol>
    <div className="hk-actions">
      <button type="button" className="hk-btn hk-btn--outline" disabled={preview} onClick={print}>{msg("recovery-codes-print")}</button>
      <button type="button" className="hk-btn hk-btn--outline" disabled={preview} onClick={download}>{msg("recovery-codes-download")}</button>
      <button type="button" className="hk-btn hk-btn--outline" disabled={preview} onClick={() => void copy()}>{msg("recovery-codes-copy")}</button>
    </div>
    {copyFailed && <p role="alert" className="hk-help">{msg("recovery-codes-download-file-description")}</p>}
    <form id="kc-recovery-codes-settings-form" action={url.loginAction} method="post" className="hk-form">
      <input type="hidden" name="generatedRecoveryAuthnCodes" value={codes.generatedRecoveryAuthnCodesAsString} />
      <input type="hidden" name="generatedAt" value={codes.generatedAt} />
      <input type="hidden" name="userLabel" value={msgStr("recovery-codes-label-default")} />
      <label className="hk-checkbox-label"><input id="kcRecoveryCodesConfirmationCheck" name="kcRecoveryCodesConfirmationCheck" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />{msg("recovery-codes-confirmation-message")}</label>
      <label className="hk-checkbox-label"><input type="checkbox" name="logout-sessions" value="on" />{msg("logoutOtherSessions")}</label>
      <button id="saveRecoveryAuthnCodesBtn" className="hk-btn" type="submit" disabled={!confirmed}>{msg("recovery-codes-action-complete")}</button>
      {isAppInitiatedAction && <button className="hk-btn hk-btn--outline" type="submit" name="cancel-aia" value="true">{msg("recovery-codes-action-cancel")}</button>}
    </form>
  </Template>;
}
