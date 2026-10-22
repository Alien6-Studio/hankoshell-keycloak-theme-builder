import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { I18n } from "../../login/i18n.js";

type KcContextInfo = Extract<KcContext, { pageId: "info.ftl" }>;

type Props = PageProps<KcContextInfo, I18n>;

export default function Info({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { message, actionUri, messageHeader } = kcContext;
  const { msgStr } = i18n;

  const header = messageHeader || msgStr("pageExpiredTitle");

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={header}
    >
      <div className="hk-alert hk-alert--info">
        <span dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} />
      </div>

      {actionUri && (
        <a
          href={actionUri}
          className="hk-btn"
          style={{ marginTop: "0.5rem", textDecoration: "none" }}
        >
          {msgStr("doContinue")}
        </a>
      )}
    </Template>
  );
}
