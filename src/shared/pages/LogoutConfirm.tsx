import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextLogoutConfirm = Extract<KcContext, { pageId: "logout-confirm.ftl" }>;

type Props = PageProps<KcContextLogoutConfirm, I18n>;

export default function LogoutConfirm({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url, logoutConfirm, client } = kcContext;
  const { msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("logoutConfirmTitle")}
    >
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginTop: 0, marginBottom: "1.25rem" }}>
        {msgStr("logoutConfirmHeader")}
      </p>

      <form id="kc-logout-confirm" action={url.logoutConfirmAction} method="post" className="hk-form">
        <input type="hidden" name="session_code" value={logoutConfirm.code} />
        <button id="kc-logout" type="submit" name="confirmLogout" value="" className="hk-btn">
          {msgStr("doLogout")}
        </button>
      </form>

      {!logoutConfirm.skipLink && client.baseUrl && (
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href={client.baseUrl} className="hk-link">
            {msgStr("backToApplication")}
          </a>
        </p>
      )}
    </Template>
  );
}
