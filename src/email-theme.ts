import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CompositionBlock, CompositionStyle, StudioComposition } from "./composition-types.js";

const templates = [{ key: "email:0", file: "email-verification.ftl", subject: "emailVerificationSubject" }, { key: "email:1", file: "password-reset.ftl", subject: "passwordResetSubject" }, { key: "email:2", file: "executeActions.ftl", subject: "executeActionsSubject" }];
function properties(value: string) {
  return value.replaceAll("'", "''").replace(/[{}]/g, character => "'" + character + "'").replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll("\r", "\\r");
}
function style(value: CompositionStyle = {}) {
  const fields: Record<string, string | number | undefined> = { color: value.color, background: value.background, "font-size": value.fontSize === undefined ? undefined : value.fontSize + "px", "font-weight": value.fontWeight, padding: value.padding === undefined ? undefined : value.padding + "px", "margin-block": value.margin === undefined ? undefined : value.margin + "px", "border-radius": value.radius === undefined ? undefined : value.radius + "px", "text-align": value.align, "line-height": value.lineHeight };
  return Object.entries(fields).filter(([, value]) => value !== undefined).map(([key, value]) => key + ":" + value).join(";");
}

/** Only compiler-owned FreeMarker expressions are emitted; authored text stays in message data. */
export async function writeEmailTheme(project: StudioComposition, directory: string) {
  const entries = templates.filter(template => project.pages[template.key]);
  if (!entries.length) return;
  const locales = [...new Set(entries.flatMap(template => project.pages[template.key]!.i18n!.supportedLocales))];
  const bundles = new Map(["default", ...locales].map(locale => [locale, new Map<string, string>()]));
  await Promise.all(["html", "text", "messages", "resources/assets"].map(name => mkdir(join(directory, name), { recursive: true })));
  const imageAssets = new Map<string, string>();
  async function image(source: string) {
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(source);
    if (!match) return literalUrl(source);
    const bytes = Buffer.from(match[2]!, "base64"), name = createHash("sha256").update(bytes).digest("hex") + "." + match[1];
    if (!imageAssets.has(name)) { imageAssets.set(name, source); await writeFile(join(directory, "resources/assets", name), bytes); }
    return `<#if url??>\${url.resourcesUrl}/assets/${name}<#else>${source}</#if>`;
  }
  for (const template of entries) {
    const page = project.pages[template.key]!;
    if (/\{\{/.test(page.subject)) throw new Error("Email subjects support literal translated text; move user variables into the body: " + template.key);
    let serial = 0;
    function message(field: string, fallback: string): string {
      const id = "studio_" + template.key.replace(":", "_") + "_" + serial++;
      for (const [locale, bundle] of bundles) {
        const translated = locale === "default" || locale === page.i18n!.defaultLocale || !page.i18n!.supportedLocales.includes(locale) ? fallback : page.i18n!.messages[locale]?.[field] ?? fallback;
        const translatedParts = translated.split(/(\{\{(?:prénom|organisation)\}\})/g);
        // MessageFormat receives compiler-owned arguments for the two supported variables.
        bundle.set(id, translatedParts.map(part => part === "{{prénom}}" ? "{0}" : part === "{{organisation}}" ? "{1}" : properties(part)).join(""));
      }
      return `\${msg("${id}", (user.firstName!user.username!""), realmName)}`;
    }
    const text = (block: CompositionBlock) => message("blocks." + block.id + ".text", block.text);
    async function blocks(zone: string) {
      return (await Promise.all(page.blocks.filter(block => block.zone === zone).map(async block => {
        const css = style(block.style);
        const align = block.style?.align || block.align;
        const frame = `width:${block.style?.width ?? 100}%;` + (align === "center" ? "margin-left:auto;margin-right:auto" : align === "right" ? "margin-left:auto;margin-right:0" : "");
        const wrap = (content: string) => `<div data-block="${literalUrl(block.id)}" style="${frame}">${content}</div>`;
        if (block.type === "image") return block.src ? wrap(`<img src="${await image(block.src)}" alt="${message("blocks." + block.id + ".alt", block.alt)}" style="display:block;max-width:100%;height:${block.style?.imageHeight ? block.style.imageHeight+"px" : "auto"};max-height:${block.style?.imageHeight || 240}px;object-fit:${block.style?.fit || "contain"};border-radius:${block.style?.radius ?? page.radius}px;${css}"/>`) : "";
        if (block.type === "divider") return wrap(`<hr style="border:0;height:${block.style?.imageHeight || 1}px;background:${block.style?.color || page.accent};${css}"/>`);
        if (block.type === "button") return wrap(`<p><a href="${literalUrl(block.href || "#")}" style="display:inline-block;padding:10px 16px;background:${page.accent};color:${page.native.buttonColor};border-radius:${page.radius}px;${css}">${text(block)}</a></p>`);
        return wrap(`<${block.type === "heading" ? "h1" : "p"} style="white-space:pre-wrap;text-align:${block.align};${css}">${text(block)}</${block.type === "heading" ? "h1" : "p"}>`);
      }))).join("\n");
    }
    const brand = message("brand.name", page.brand.name), header = await blocks("header"), aside = await blocks("aside"), footer = await blocks("footer");
    const title = message("native.title", page.native.copy.title || ""), description = message("native.description", page.native.copy.description || ""), action = message("native.action", page.native.copy.action || "");
    const logo = page.brand.logo ? `<img src="${await image(page.brand.logo)}" alt="${message("brand.alt", page.brand.alt)}" height="${page.brand.size}"/>` : "";
    const a = page.appearance, n = page.native;
    const html = `<#ftl output_format="HTML" auto_esc=true>\n<!doctype html><html lang="\${locale.toLanguageTag()}" dir="\${ltr?then('ltr','rtl')}"><head><meta charset="utf-8"/></head><body style="margin:0;background:${a.background};color:${a.foreground};font-family:${a.font.replaceAll('"', "&quot;")}"><table role="presentation" width="100%"><tr><td style="padding:${a.padding}px"><table role="presentation" width="100%" style="max-width:${a.contentWidth}px;margin:auto"><tr><td>${logo}<strong>${brand}</strong>${header}${aside}<div style="background:${n.background};color:${n.foreground};padding:${n.padding}px;border-radius:${n.radius}px"><h2 style="${style(n.styles.title)}">${title}</h2><p style="white-space:pre-wrap;${style(n.styles.description)}">${description}</p><p><a href="\${link}" style="display:inline-block;background:${n.buttonBackground};color:${n.buttonColor};padding:12px 18px;border-radius:${page.radius}px;${style(n.styles.action)}">${action}</a></p><p style="font-size:12px">\${linkExpirationFormatter(linkExpiration)}</p></div>${footer}</td></tr></table></td></tr></table></body></html>\n`;
    const plain = `<#ftl output_format="plainText">\n${brand}\n${page.blocks.filter(block => block.type !== "image" && block.type !== "divider").map(block => text(block)).join("\n\n")}\n\n${title}\n${description}\n${action}: \${link}\n\${linkExpirationFormatter(linkExpiration)}\n`;
    for (const [locale, bundle] of bundles) {
      const subject = locale === "default" || locale === page.i18n!.defaultLocale ? page.subject : page.i18n!.messages[locale]?.subject ?? page.subject;
      if (/\{\{/.test(subject)) throw new Error("Variables in translated email subjects are unsupported: " + template.key);
      bundle.set(template.subject, properties(subject));
    }
    await writeFile(join(directory, "html", template.file), html);
    await writeFile(join(directory, "text", template.file), plain);
  }
  for (const [locale, messages] of bundles) await writeFile(join(directory, "messages", locale === "default" ? "messages.properties" : "messages_" + locale.replaceAll("-", "_") + ".properties"), [...messages].map(([key, value]) => key + "=" + value).join("\n") + "\n");
  await writeFile(join(directory, "theme.properties"), "parent=keycloak\nlocales=" + locales.join(",") + "\n");
}
function literalUrl(value: string) {
  // Attribute data must never introduce a FreeMarker expression, even for validated URLs.
  return value.replace(/[&<>"'${}]/g, character => "&#" + character.charCodeAt(0) + ";");
}
