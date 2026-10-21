import { useEffect } from "react";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import type { KcContext } from "./KcContext.js";
import type { I18n } from "./i18n.js";
import Template from "../shared/Template.js";
import { useTheme } from "../provider.js";
import { usePresentation } from "../presentation.js";

export default function LoginTemplate(props: Readonly<TemplateProps<KcContext, I18n>>) {
  const { config } = useTheme(); const { css, preview } = usePresentation();
  useEffect(() => { if (!preview) document.title = props.documentTitle ?? `${config.headline ?? config.name} — ${props.i18n.msgStr("doLogIn")}`; }, [config.headline, config.name, props.i18n, props.documentTitle, preview]);
  return <Template {...props} css={css} />;
}
