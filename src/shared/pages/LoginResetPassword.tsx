import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextLoginResetPassword = Extract<KcContext, { pageId: "login-reset-password.ftl" }>;

type Props = PageProps<KcContextLoginResetPassword, I18n>;

export default function LoginResetPassword({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url, realm, auth } = kcContext;
  const { msgStr } = i18n;

  let usernameLabel = msgStr("username");
  if (realm.loginWithEmailAllowed && !realm.duplicateEmailsAllowed) {
    usernameLabel = msgStr("email");
  }

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("emailForgotTitle")}
    >
      <form action={url.loginAction} method="post" className="hk-form">
        <div className="hk-field">
          <label htmlFor="username" className="hk-label">
            {usernameLabel}
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="hk-input"
            autoFocus
            defaultValue={auth?.attemptedUsername ?? ""}
            autoComplete={realm.loginWithEmailAllowed && !realm.duplicateEmailsAllowed ? "email" : "username"}
          />
        </div>

        <button type="submit" className="hk-btn" style={{ marginTop: "0.25rem" }}>
          {msgStr("doSubmit")}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        <a href={url.loginUrl} className="hk-link">
          {msgStr("backToLogin")}
        </a>
      </p>
    </Template>
  );
}
