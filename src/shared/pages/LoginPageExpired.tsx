import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextLoginPageExpired = Extract<KcContext, { pageId: "login-page-expired.ftl" }>;

type Props = PageProps<KcContextLoginPageExpired, I18n>;

export default function LoginPageExpired({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url } = kcContext;
  const { msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("pageExpiredTitle")}
    >
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", margin: "0 0 1rem" }}>
        {msgStr("pageExpiredMsg1")}{" "}
        <a href={url.loginRestartFlowUrl} className="hk-link" style={{ color: "var(--primary)" }}>
          {msgStr("doClickHere")}
        </a>
        {" "}{msgStr("pageExpiredMsg2")}{" "}
        <a href={url.loginAction} className="hk-link" style={{ color: "var(--primary)" }}>
          {msgStr("doClickHere")}
        </a>
      </p>
    </Template>
  );
}
