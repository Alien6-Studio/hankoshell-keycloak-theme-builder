import { type CSSProperties, type ReactNode } from "react";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize/index.js";
import type { KcContext } from "./login/KcContext.js";
import type { I18n } from "./login/i18n.js";
import type { CompositionPage, CompositionStyle, StudioComposition } from "./composition-types.js";
import {frameCss,frameVariables} from "./composition-frame.js";
import { baseCss } from "./styles.js";
import { compositionPage, nativePages } from "./composition-model.js";

function elementStyle(style: CompositionStyle = {}): CSSProperties {
  return { color: style.color, background: style.background, fontSize: style.fontSize, fontWeight: style.fontWeight, padding: style.padding, marginBlock: style.margin, borderRadius: style.radius, textAlign: style.align, lineHeight: style.lineHeight };
}
export function CompositionTemplate(props: Readonly<TemplateProps<KcContext, I18n>> & { project: StudioComposition }) {
  const { project, kcContext, i18n, children } = props;
  const locale = i18n.currentLanguage.languageTag;
  const page = compositionPage(project, kcContext.pageId, locale), { appearance: a, native: n } = page;
  const customized = nativePages.has(kcContext.pageId);
  const message = props.displayMessage !== false && (kcContext.message?.type !== "warning" || !kcContext.isAppInitiatedAction) ? kcContext.message : undefined;
  function zone(name: string) {
    return <div className={"hkc-zone hkc-" + name} data-hanko-slot={name}>{page.blocks.filter(block => block.zone === name).map(block => {
      const style = { textAlign: block.align, ...elementStyle(block.style), whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as CSSProperties;
      const align = block.style?.align || block.align;
      return <div className="hkc-block" data-block={block.id} key={block.id} style={{width:block.style?.width ? block.style.width+"%" : undefined,marginInline:align==="center" ? "auto" : align==="right" ? "auto 0" : undefined}}>{block.type === "image" ? block.src && <img src={block.src} alt={block.alt} style={{ ...style, maxWidth: "100%", height: block.style?.imageHeight, maxHeight: block.style?.imageHeight || 240, objectFit: block.style?.fit || "contain", borderRadius: block.style?.radius ?? page.radius }} />
        : block.type === "divider" ? <hr style={{ border: 0, height: block.style?.imageHeight || 1, background: block.style?.color || page.accent, marginBlock: 12, ...elementStyle(block.style) }} />
          : block.type === "button" ? <a href={block.href || "#"} style={{ display: "inline-block", background: page.accent, color: n.buttonColor, padding: "10px 16px", borderRadius: page.radius, ...style }}>{block.text}</a>
            : block.type === "heading" ? <h2 style={{ fontFamily:page.appearance.headingFont||page.appearance.font, fontSize: 36, fontWeight: 600, lineHeight: 1.15, margin: 0, ...style }}>{block.text}</h2> : <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, ...style }}>{block.text}</p>}</div>;
    })}</div>;
  }
  const variables = { ...frameVariables(page), "--bg": a.background, "--bg-card": n.background, "--fg": n.foreground, "--fg-muted": a.muted, "--primary": n.buttonBackground, "--primary-fg": n.buttonColor, "--border": n.inputBorder, "--input-bg": n.inputBackground, "--font-family": a.font, "--control-radius": page.radius + "px", "--card-radius": n.radius + "px", "--content-width": "100%", "--hkc-gap": a.gap + "px", "--hkc-native-gap": n.gap + "px" } as CSSProperties;
  return <div className="hk-theme hkc-root" lang={locale} dir={["ar", "he", "fa", "ur"].includes(locale.split("-")[0]!) ? "rtl" : "ltr"} style={{ ...variables, minHeight: "100svh", boxSizing: "border-box", background: a.background, color: a.foreground, padding: a.padding, fontFamily: a.font, backgroundImage: a.backgroundImage ? `url(${JSON.stringify(a.backgroundImage)})` : undefined, backgroundSize: a.backgroundFit, backgroundPosition: "center" }}>
    <style>{baseCss}{compositionCss}{frameCss}</style><div className="hkc-page" data-hanko-frame={a.composition} data-hanko-family="login" data-layout={page.layout} style={{ maxWidth: a.contentWidth, marginInline: "auto" }}>
      <div className="hkc-brand" data-hanko-slot="brand" style={{ justifyContent: page.brand.align === "center" ? "center" : page.brand.align === "right" ? "flex-end" : "flex-start", color: page.brand.color, fontSize: page.brand.fontSize }}>{page.brand.logo ? <img src={page.brand.logo} alt={page.brand.alt} style={{ maxWidth: 180, height: page.brand.size, objectFit: "contain" }} /> : page.brand.mark ? <span style={{ display: "grid", placeItems: "center", width: page.brand.size, height: page.brand.size, borderRadius: 6, background: page.accent, color: n.buttonColor }}>{page.brand.mark}</span> : null}<strong>{page.brand.name}</strong></div>
      {zone("header")}<div className="hkc-body" data-hanko-slot="body">{zone("aside")}<section className="hkc-form" data-hanko-slot="form" data-hanko-field={n.fieldStyle} data-hanko-action={n.actionSize} style={{ background: n.background, color: n.foreground, padding: n.padding, borderRadius: n.radius }}>
        {props.headerNode && <h1 id="kc-page-title" style={{fontFamily:a.headingFont||a.font,...elementStyle(n.styles.title)}}>{customized ? n.copy.title : props.headerNode}</h1>}
        {customized && n.copy.description && <p className="hk-help" style={elementStyle(n.styles.description)}>{n.copy.description}</p>}
        {props.displayRequiredFields && <p className="hk-help">* {i18n.msg("requiredFields")}</p>}
        {kcContext.auth?.showUsername && !kcContext.auth.showResetCredentials && <div className="hk-row hk-identity"><span>{kcContext.auth.attemptedUsername}</span><a className="hk-link" href={kcContext.url.loginRestartFlowUrl}>{i18n.msg("restartLoginTooltip")}</a></div>}
        {message && <div role={message.type === "error" ? "alert" : "status"} className={`hk-alert hk-alert--${message.type}`}><span dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} /></div>}
        <NativeStyles page={page} />{children}
        {kcContext.auth?.showTryAnotherWayLink && <form id="kc-select-try-another-way-form" action={kcContext.url.loginAction} method="post"><input type="hidden" name="tryAnotherWay" value="on" /><button className="hk-link" id="try-another-way" type="submit">{i18n.msg("doTryAnotherWay")}</button></form>}
        {props.socialProvidersNode}{props.displayInfo && props.infoNode && <div className="hk-info">{props.infoNode}</div>}
      </section></div>{zone("footer")}
    </div></div>;
}
function NativeStyles({ page }: { page: CompositionPage }): ReactNode {
  const selectors: Record<string, string> = { usernameLabel: 'label[for="username"]', passwordLabel: 'label[for="password"]', otpLabel: 'label[for="otp"],label[for="totp"]', emailLabel: 'label[for="email"]', action: '.hk-btn[name="login"],input[type="submit"]', usernameExample: '#username', passwordExample: '#password', otpExample: '#otp,#totp', emailExample: '#email' };
  const declarations = (style: CompositionStyle) => Object.entries(elementStyle(style)).filter(([, value]) => value !== undefined).map(([key, value]) => key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase()) + ":" + (typeof value === "number" && !["fontWeight", "lineHeight"].includes(key) ? value + "px" : value)).join(";");
  return <style>{Object.entries(page.native.styles).filter(([key]) => selectors[key]).map(([key, style]) => `.hkc-root .hkc-form ${selectors[key]!.split(",").join(",.hkc-root .hkc-form ")}{${declarations(style)}}`).join("\n")}</style>;
}
const compositionCss = `.hkc-root *{box-sizing:border-box}.hkc-brand{display:flex;align-items:center;gap:7px;margin-bottom:24px}.hkc-body{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1fr);align-items:center;gap:var(--hkc-gap);margin:16px 0 20px}.hkc-page[data-layout=right] .hkc-aside{order:2}.hkc-page[data-layout=center] .hkc-body{display:flex;flex-direction:column;align-items:stretch}.hkc-page[data-layout=center] .hkc-form{width:100%;max-width:560px;margin-inline:auto}.hkc-zone,.hkc-form{min-width:0}.hkc-block{margin:5px 0}.hkc-zone img{display:block;max-width:100%}.hkc-form h1{font-size:19px;line-height:1.25;margin:0 0 10px}.hkc-form .hk-field{margin-bottom:var(--hkc-native-gap)}.hkc-form .hk-input{font-size:12px}.hkc-form .hk-label{font-size:12px}.hkc-form a{overflow-wrap:anywhere}@media(max-width:640px){.hkc-body{display:flex;flex-direction:column;align-items:stretch}.hkc-page .hkc-aside{order:0!important}.hkc-page .hkc-form{width:100%}.hkc-root h2{font-size:28px!important}}`;
