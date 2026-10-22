import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextLoginUpdatePassword = Extract<KcContext, { pageId: "login-update-password.ftl" }>;

type Props = PageProps<KcContextLoginUpdatePassword, I18n>;

function EyeIcon({ open }: Readonly<{ open: boolean }>) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginUpdatePassword({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url } = kcContext;
  const { msgStr } = i18n;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("updatePasswordTitle")}
    >
      <form action={url.loginAction} method="post" className="hk-form">
        <input type="hidden" id="username" name="username" value={(kcContext as any).username ?? ""} autoComplete="username" />
        <input type="hidden" id="id-hidden-input" name="credentialId" value={(kcContext as any).credentialId ?? ""} />

        <div className="hk-field">
          <label htmlFor="password-new" className="hk-label">
            {msgStr("passwordNew")}
          </label>
          <div className="hk-input-wrap">
            <input
              id="password-new"
              name="password-new"
              type={showPassword ? "text" : "password"}
              className="hk-input hk-input--padded"
              autoFocus
              autoComplete="new-password"
            />
            <button
              type="button"
              className="hk-pw-toggle"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <div className="hk-field">
          <label htmlFor="password-confirm" className="hk-label">
            {msgStr("passwordConfirm")}
          </label>
          <div className="hk-input-wrap">
            <input
              id="password-confirm"
              name="password-confirm"
              type={showConfirm ? "text" : "password"}
              className="hk-input hk-input--padded"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="hk-pw-toggle"
              onClick={() => setShowConfirm(v => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        <button type="submit" className="hk-btn" style={{ marginTop: "0.25rem" }}>
          {msgStr("doSubmit")}
        </button>
      </form>
    </Template>
  );
}
