import type { CSSProperties, ReactNode } from "react";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { baseCss } from "../styles.js";
import { themeVariables } from "../config.js";
import { useTheme } from "../provider.js";
import { ThemeToggle } from "./ThemeToggle.js";
import type { KcContext } from "../login/KcContext.js";
import type { I18n } from "../login/i18n.js";

type Props = TemplateProps<KcContext, I18n> & { css?: string; logoNode?: ReactNode };

export default function Template(props: Readonly<Props>) {
  const { config, mode } = useTheme();
  const { kcContext, i18n, children, headerNode, infoNode, socialProvidersNode, displayMessage = true, displayInfo = false } = props;
  const message = displayMessage && (kcContext.message?.type !== "warning" || !kcContext.isAppInitiatedAction) ? kcContext.message : undefined;
  return <div className="hk-theme" style={themeVariables(config, mode) as CSSProperties}><div className="hk-page" data-mode={mode} data-theme={mode}>
    <style>{baseCss}</style>
    {props.css && <style>{props.css}</style>}
    <div className="hk-glow" aria-hidden="true" />
    <div className="hk-container"><div className="hk-card">
      <ThemeToggle />
      <div className="hk-logo">{props.logoNode ?? <div className="hk-brand">
        <div className="hk-brand-heading">{config.logoUrl && <img className="hk-brand-mark" src={config.logoUrl} alt="" />}{config.headline && <p className="hk-logo-title">{config.headline}</p>}</div>
        {config.subline && <p className="hk-logo-subtitle">{config.subline}</p>}
      </div>}</div>
      {headerNode && <h1 id="kc-page-title" className="hk-header">{headerNode}</h1>}
      {props.displayRequiredFields && <p className="hk-help">* {i18n.msg("requiredFields")}</p>}
      {kcContext.auth?.showUsername && !kcContext.auth.showResetCredentials && <div className="hk-row hk-identity"><span>{kcContext.auth.attemptedUsername}</span><a className="hk-link" href={kcContext.url.loginRestartFlowUrl}>{i18n.msg("restartLoginTooltip")}</a></div>}
      {message && <div role={message.type === "error" ? "alert" : "status"} className={`hk-alert hk-alert--${message.type}`}><span dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} /></div>}
      {children}
      {kcContext.auth?.showTryAnotherWayLink && <form id="kc-select-try-another-way-form" action={kcContext.url.loginAction} method="post" className="hk-alternative"><input type="hidden" name="tryAnotherWay" value="on" /><button className="hk-link" id="try-another-way" type="submit">{i18n.msg("doTryAnotherWay")}</button></form>}
      {socialProvidersNode}{displayInfo && infoNode && <div className="hk-info">{infoNode}</div>}
    </div></div>
  </div></div>;
}
