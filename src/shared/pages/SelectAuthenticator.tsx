import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "../../login/i18n.js";

type KcContextSelectAuthenticator = Extract<KcContext, { pageId: "select-authenticator.ftl" }>;

type Props = PageProps<KcContextSelectAuthenticator, I18n>;

export default function SelectAuthenticator({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { url, auth } = kcContext;
  const { msgStr, advancedMsg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("loginChooseAuthenticator")}
    >
      <div className="hk-authenticator-list">
        {auth.authenticationSelections.map(selection => (
          <form key={selection.authExecId} action={url.loginAction} method="post">
            <input type="hidden" name="authenticationExecution" value={selection.authExecId} />
            <button type="submit" className="hk-authenticator-item">
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--fg)" }}>
                  {advancedMsg(selection.displayName)}
                </div>
                {selection.helpText && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.25rem" }}>
                    {advancedMsg(selection.helpText)}
                  </div>
                )}
              </div>
            </button>
          </form>
        ))}
      </div>
    </Template>
  );
}
