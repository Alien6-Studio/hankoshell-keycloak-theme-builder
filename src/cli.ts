#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { parseTheme, type ThemeConfig } from "./config.js";
import { buildTheme, previewTheme, type BuildOptions } from "./builder.js";
import { buildStudioProject, previewStudioProject } from "./project-builder.js";

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  help: { type: "boolean", short: "h" }, out: { type: "string" }, assets: { type: "string" }, renderer: { type: "string" }, "runtime-adapter": { type: "string" }, "jar-name": { type: "string" }, port: { type: "string" }, host: { type: "string" },
  name: { type: "string" }, "project-sha256": { type: "string" },
} });
const sample: ThemeConfig = { version: 1, name: "aurora", headline: "Aurora", subline: "Welcome back", colors: { dark: { primary: "#38bdf8", primaryForeground: "#0b1220" }, light: { primary: "#2563eb" } }, layout: { cardRadius: "16px", controlRadius: "12px", contentWidth: "440px" } };
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => controller.abort());
async function main() {
  const [command, argument] = positionals;
  if (values.help || !command) { console.log("hanko-theme init [theme.json]\nhanko-theme dev <theme.json> [--assets directory] [--port 5173]\nhanko-theme build <theme.json> [--assets directory] [--out dist_keycloak] [--jar-name name.jar]\nhanko-theme build-env [--assets directory] [--out /output]\nhanko-theme dev-project <project.studio.json> [--port 5173]\nhanko-theme build-project <project.studio.json[.gz]> [--name theme] [--out dist_keycloak]\n\nCustom React: --renderer <trusted local TSX module exporting a KeycloakPageProps component>.\nAdvanced: --runtime-adapter <trusted local TypeScript module exporting a ThemeLoader>.\nJAR builds require Java 21 and Maven; previews bind to loopback by default."); return; }
  if (command === "init") { const target = resolve(argument ?? "theme.json"); await writeFile(target, JSON.stringify(sample, null, 2) + "\n", { flag: "wx" }); console.log(`Created ${target}`); return; }
  if (["build-project", "dev-project"].includes(command)) {
    if (!argument || positionals.length !== 2 || values.renderer || values["runtime-adapter"]) throw new Error("Use build-project <project.json[.gz]> with the installed renderer");
    let bytes = await readFile(resolve(argument));
    if (bytes.length > 40 * 1024 * 1024) throw new Error("Project exceeds 40 MiB");
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = gunzipSync(bytes, { maxOutputLength: 40 * 1024 * 1024 });
    if (values["project-sha256"] && (!/^[a-f0-9]{64}$/.test(values["project-sha256"]) || createHash("sha256").update(bytes).digest("hex") !== values["project-sha256"])) throw new Error("Project snapshot digest mismatch");
    const input: unknown = JSON.parse(bytes.toString("utf8"));
    const options = { name: values.name, outputDir: values.out, jarName: values["jar-name"], signal: controller.signal, port: values.port ? Number(values.port) : undefined, host: values.host };
    if (command === "dev-project") await previewStudioProject(input, options);
    else console.log(JSON.stringify({ ...await buildStudioProject(input, options), projectSha256: createHash("sha256").update(bytes).digest("hex") }));
    return;
  }
  if (!["dev", "build", "build-env"].includes(command) || (command !== "build-env" && !argument) || positionals.length > (command === "build-env" ? 1 : 2)) throw new Error("Use hanko-theme --help for commands");
  const config = command === "build-env" ? fromEnvironment(process.env) : parseTheme(JSON.parse(await readFile(resolve(argument!), "utf8")));
  const options: BuildOptions = { assetsDir: values.assets, renderer: values.renderer, runtimeAdapter: values["runtime-adapter"], outputDir: values.out ?? (command === "build-env" ? process.env.OUTPUT_DIR ?? "/output" : undefined), jarName: values["jar-name"] ?? (command === "build-env" ? process.env.THEME_JAR_NAME : undefined), port: values.port ? Number(values.port) : undefined, host: values.host, signal: controller.signal };
  if (command === "dev") await previewTheme(config, options);
  else { const artifact = await buildTheme(config, options); console.log(JSON.stringify(artifact)); }
}
function fromEnvironment(env: NodeJS.ProcessEnv): ThemeConfig {
  return parseTheme({ version: 1, name: env.THEME_SLUG, headline: env.THEME_HEADLINE, subline: env.THEME_SUBLINE, logoUrl: env.THEME_LOGO_URL, fontFamily: env.THEME_FONT_FAMILY,
    colors: { dark: Object.fromEntries([["primary", env.THEME_PRIMARY_COLOR], ["background", env.THEME_BACKGROUND_COLOR], ["foreground", env.THEME_FOREGROUND_COLOR]].filter(([, value]) => value)), light: env.THEME_PRIMARY_COLOR ? { primary: env.THEME_PRIMARY_COLOR } : {} },
  });
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Theme command failed"); process.exitCode = controller.signal.aborted ? 130 : 1; });
