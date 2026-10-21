#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir, mkdtemp, symlink, rm, copyFile, rename, stat, realpath } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { parseTheme, type ThemeConfig } from "./config.js";

const require = createRequire(import.meta.url);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ownPackage = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8")) as { name: string; version: string };
const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  help: { type: "boolean", short: "h" }, out: { type: "string" }, assets: { type: "string" }, "runtime-adapter": { type: "string" }, "jar-name": { type: "string" }, port: { type: "string" }, host: { type: "string" },
} });

function run(binary: string, args: string[], cwd: string, env = process.env): Promise<void> {
  return new Promise((accept, reject) => {
    const child = spawn(binary, args, { cwd, env, stdio: "inherit", shell: false });
    const interrupt = () => child.kill("SIGINT"); const terminate = () => child.kill("SIGTERM");
    process.once("SIGINT", interrupt); process.once("SIGTERM", terminate);
    child.once("error", reject);
    child.once("close", (code, signal) => { process.off("SIGINT", interrupt); process.off("SIGTERM", terminate); if (code === 0 || signal === "SIGINT") accept(); else reject(new Error(`Build command failed (${code ?? signal})`)); });
  });
}
async function exists(path: string) { try { await stat(path); return true; } catch { return false; } }
async function asset(root: string, name: string): Promise<string> {
  const base = await realpath(root); const path = await realpath(resolve(base, name));
  if (!path.startsWith(base + sep)) throw new Error("Assets must stay inside the selected asset directory");
  if ((await stat(path)).size > 512 * 1024) throw new Error("Theme assets must not exceed 512 KiB each");
  return path;
}
async function dependencies(): Promise<string> {
  let path = dirname(require.resolve("vite/package.json"));
  while (dirname(path) !== path) { if (path.endsWith(`${sep}node_modules`)) return path; path = dirname(path); }
  throw new Error("Installed builder dependencies were not found");
}

async function build(command: "build" | "dev", filename: string) {
  const original = JSON.parse(await readFile(resolve(filename), "utf8")) as unknown;
  let config = parseTheme(original);
  const assets = values.assets ? await realpath(resolve(values.assets)) : undefined;
  const stylesheet = assets && await exists(join(assets, "theme.css")) ? await asset(assets, "theme.css") : undefined;
  if (assets && await exists(join(assets, "logo.svg"))) {
    config = parseTheme({ ...config, logoUrl: `data:image/svg+xml;base64,${(await readFile(await asset(assets, "logo.svg"))).toString("base64")}` });
  }
  const jar = values["jar-name"] ?? `${config.name}-theme.jar`;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}\.jar$/.test(jar)) throw new Error("Invalid JAR filename");
  const work = await realpath(await mkdtemp(join(tmpdir(), "hanko-theme-")));
  try {
    const source = join(work, "src"); await mkdir(join(source, "login"), { recursive: true });
    await mkdir(join(work, "bin")); await mkdir(join(work, "public", "licenses"), { recursive: true });
    const modules = await dependencies(); await symlink(modules, join(work, "node_modules"), "dir");
    const viteBin = join(dirname(require.resolve("vite/package.json")), "bin", "vite.js");
    const keycloakBin = join(dirname(require.resolve("keycloakify/package.json")), "bin", "main.js");
    // Keycloakify asks npx to inspect Vite. Resolve only the installed local tool;
    // a build must never install a command selected by an input document.
    await writeFile(join(work, "bin", "npx"), `#!/usr/bin/env node\nimport{spawnSync}from'node:child_process';const args=process.argv.slice(2);if(args.shift()!=='vite')process.exit(1);const p=spawnSync(process.execPath,[${JSON.stringify(viteBin)},...args],{stdio:'inherit'});process.exit(p.status??1);\n`, { mode: 0o755 });
    if (assets && await exists(join(assets, "OFL.txt"))) await copyFile(await asset(assets, "OFL.txt"), join(work, "public", "licenses", "OFL.txt"));
    const adapter = values["runtime-adapter"] ? await realpath(resolve(values["runtime-adapter"])) : undefined;
    const pageImport = fileURLToPath(new URL("./keycloak.js", import.meta.url));
    const cssImport = stylesheet ? `import css from ${JSON.stringify(stylesheet + "?inline")};` : 'const css = undefined;';
    const loaderImport = adapter ? `import loader from ${JSON.stringify(adapter)};` : 'const loader = undefined;';
    const keycloakify = JSON.parse(await readFile(require.resolve("keycloakify/package.json"), "utf8")) as { version: string };
    await writeFile(join(work, "package.json"), JSON.stringify({ name: `${config.name}-login-theme`, private: true, type: "module", version: ownPackage.version, dependencies: { [ownPackage.name]: ownPackage.version, keycloakify: keycloakify.version } }, null, 2));
    await writeFile(join(source, "theme-config.ts"), `export default ${JSON.stringify(config)} as const;\n`);
    await writeFile(join(source, "login", "KcPage.tsx"), `import {KeycloakPage} from ${JSON.stringify(pageImport)};import config from '../theme-config';${cssImport}${loaderImport}\nexport default function KcPage({kcContext}){return <KeycloakPage kcContext={kcContext} config={config} css={css} loader={loader} persistMode/>;}\n`);
    await writeFile(join(source, "login", "KcContext.ts"), `export type {KcContext} from 'keycloakify/login/KcContext';\n`);
    const previewImport = fileURLToPath(new URL("./workbench.js", import.meta.url));
    await writeFile(join(source, "main.tsx"), `import {createRoot} from 'react-dom/client';import KcPage from './login/KcPage';const root=createRoot(document.getElementById('root')!);if(import.meta.env.DEV&&!window.kcContext){import(${JSON.stringify(previewImport)}).then(({ThemeWorkbench})=>root.render(<ThemeWorkbench config={config} css={css}/>));}else{root.render(<KcPage kcContext={window.kcContext}/>);}import config from './theme-config';${cssImport}\n`);
    await writeFile(join(work, "index.html"), '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Theme preview</title><style>html,body{margin:0;min-height:100%}</style></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
    await writeFile(join(work, "vite.config.ts"), `import{defineConfig}from'vite';import react from'@vitejs/plugin-react';import{keycloakify}from'keycloakify/vite-plugin';export default defineConfig({cacheDir:${JSON.stringify(join(work,'.vite'))},resolve:{dedupe:['react','react-dom']},build:{assetsInlineLimit:131072},server:{fs:{allow:${JSON.stringify([work, packageRoot, modules, ...(assets ? [assets] : []), ...(adapter ? [dirname(adapter)] : [])])}}},plugins:[react(),keycloakify({themeName:${JSON.stringify(config.name)},accountThemeImplementation:'none',keycloakVersionTargets:{'22-to-25':false,'all-other-versions':${JSON.stringify(jar)}}})]});\n`);
    const env = { ...process.env, XDG_CACHE_HOME: process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), PATH: `${join(work, "bin")}${sep === "/" ? ":" : ";"}${process.env.PATH ?? ""}` };
    if (command === "dev") {
      const port = values.port ?? "5173"; if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid preview port");
      await run(process.execPath, [viteBin, "--host", values.host ?? "127.0.0.1", "--port", port, "--strictPort"], work, env);
    } else {
      await run(process.execPath, [viteBin, "build"], work, env);
      await run(process.execPath, [keycloakBin, "build"], work, env);
      const output = resolve(values.out ?? "dist_keycloak"); await mkdir(output, { recursive: true });
      const temporary = join(output, `.${jar}.${process.pid}.tmp`);
      try { await copyFile(join(work, "dist_keycloak", jar), temporary); await rename(temporary, join(output, jar)); } finally { await rm(temporary, { force: true }); }
      console.log(`Built ${join(output, jar)}`);
    }
  } finally { await rm(work, { recursive: true, force: true }); }
}

const sample: ThemeConfig = { version: 1, name: "aurora", headline: "Aurora", subline: "Welcome back", colors: { dark: { primary: "#38bdf8", primaryForeground: "#0b1220" }, light: { primary: "#2563eb" } }, layout: { cardRadius: "16px", controlRadius: "12px", contentWidth: "440px" } };
async function main() {
  const [command, argument] = positionals;
  if (values.help || !command) { console.log("hanko-theme init [theme.json]\nhanko-theme dev <theme.json> [--assets directory] [--port 5173]\nhanko-theme build <theme.json> [--assets directory] [--out dist_keycloak] [--jar-name name.jar]\n\nAdvanced: --runtime-adapter <trusted local TypeScript module exporting a ThemeLoader>.\nJAR builds require Java 21; previews bind to loopback by default."); return; }
  if (command === "init") { const target = resolve(argument ?? "theme.json"); await writeFile(target, JSON.stringify(sample, null, 2) + "\n", { flag: "wx" }); console.log(`Created ${target}`); return; }
  if ((command !== "dev" && command !== "build") || !argument || positionals.length > 2) throw new Error("Use hanko-theme --help for commands");
  await build(command, argument);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Theme command failed"); process.exitCode = 1; });
