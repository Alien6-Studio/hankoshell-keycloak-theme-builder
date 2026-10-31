import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextLoginIdpLinkConfirm = Extract<KcContext, { pageId: "login-idp-link-confirm.ftl" }>;

type Props = PageProps<KcContextLoginIdpLinkConfirm, I18n>;

export default function LoginIdpLinkConfirm({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url, idpAlias } = kcContext;
  const { msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("confirmLinkIdpTitle")}
    >
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", margin: "0 0 1.25rem" }}>
        {msgStr("confirmLinkIdpReviewProfile", idpAlias)}
      </p>

      <div className="hk-form">
        <form action={url.loginAction} method="post">
          <input type="hidden" name="submitAction" value="updateProfile" />
          <button type="submit" className="hk-btn hk-btn--outline" style={{ marginBottom: "0.5rem" }}>
            {msgStr("confirmLinkIdpReviewProfile")}
          </button>
        </form>

        <form action={url.loginAction} method="post">
          <input type="hidden" name="submitAction" value="linkByEmail" />
          <button type="submit" className="hk-btn">
            {msgStr("confirmLinkIdpContinue", idpAlias)}
          </button>
        </form>
      </div>
    </Template>
  );
}
