import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";
import { kcSanitize } from "keycloakify/lib/kcSanitize";

type KcContextLoginOtp = Extract<KcContext, { pageId: "login-otp.ftl" }>;

type Props = PageProps<KcContextLoginOtp, I18n>;

export default function LoginOtp({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url, otpLogin, messagesPerField } = kcContext;
  const { msgStr } = i18n;

  const hasMultipleCredentials = otpLogin.userOtpCredentials.length > 1;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("doLogIn")}
      displayMessage={!messagesPerField.existsError("totp")}
    >
      <form id="kc-otp-login-form" action={url.loginAction} method="post" className="hk-form">
        {hasMultipleCredentials && (
          <div className="hk-field">
            <label htmlFor="selectedCredentialId" className="hk-label">
              {msgStr("loginOtpOneTime")}
            </label>
            <select
              id="selectedCredentialId"
              name="selectedCredentialId"
              className="hk-input"
              defaultValue={otpLogin.selectedCredentialId ?? ""}
              style={{ height: "2.25rem" }}
            >
              {otpLogin.userOtpCredentials.map(cred => (
                <option key={cred.id} value={cred.id}>
                  {cred.userLabel}
                </option>
              ))}
            </select>
          </div>
        )}

        {!hasMultipleCredentials && (
          <input
            type="hidden"
            name="selectedCredentialId"
            value={otpLogin.selectedCredentialId ?? (otpLogin.userOtpCredentials[0]?.id ?? "")}
          />
        )}

        <div className="hk-field">
          <label htmlFor="otp" className="hk-label">
            {msgStr("loginOtpOneTime")}
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            className="hk-input hk-otp-input"
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-invalid={messagesPerField.existsError("totp")}
            aria-describedby={messagesPerField.existsError("totp") ? "input-error-otp-code" : undefined}
          />
          {messagesPerField.existsError("totp") && <span id="input-error-otp-code" className="hk-alert hk-alert--error" aria-live="polite" dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.get("totp")) }} />}
        </div>

        <button id="kc-login" name="login" type="submit" className="hk-btn" style={{ marginTop: "0.25rem" }}>
          {msgStr("doLogIn")}
        </button>
      </form>
    </Template>
  );
}
