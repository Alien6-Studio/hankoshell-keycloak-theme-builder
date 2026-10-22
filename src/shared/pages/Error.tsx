import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { I18n } from "../../login/i18n.js";

type KcContextError = Extract<KcContext, { pageId: "error.ftl" }>;

type Props = PageProps<KcContextError, I18n>;

export default function ErrorPage({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { message, client } = kcContext;
  const { msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msgStr("errorTitle")}
    >
      <div className="hk-alert hk-alert--error">
        <span dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} />
      </div>

      {client?.baseUrl && (
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href={client.baseUrl} className="hk-link">
            {msgStr("backToApplication")}
          </a>
        </p>
      )}
    </Template>
  );
}
