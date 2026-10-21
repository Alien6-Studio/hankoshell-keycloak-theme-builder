import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextLoginVerifyEmail = Extract<KcContext, { pageId: "login-verify-email.ftl" }>;

type Props = PageProps<KcContextLoginVerifyEmail, I18n>;

export default function LoginVerifyEmail({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url, user } = kcContext;
  const { msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("emailVerifyTitle")}
    >
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", margin: "0 0 1rem", lineHeight: 1.5 }}>
        {user?.email
          ? msgStr("emailVerifyInstruction1", user.email)
          : msgStr("emailVerifyInstruction1")}
      </p>

      <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", margin: 0 }}>
        {msgStr("emailVerifyInstruction2")}{" "}
        <a href={url.loginAction} className="hk-link" style={{ color: "var(--primary)" }}>
          {msgStr("doClickHere")}
        </a>{" "}
        {msgStr("emailVerifyInstruction3")}
      </p>
    </Template>
  );
}
