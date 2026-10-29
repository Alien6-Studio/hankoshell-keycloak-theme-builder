import { readFile, writeFile, mkdir, mkdtemp, symlink, rm, copyFile, rename, stat, realpath } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { tmpdir, homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { parseTheme, type ThemeConfig } from "./config.js";
import { htmlText, sourceLiteral } from "./serialization.js";
import { hebrewMessages } from "./login/messages/he-core.js";

const require = createRequire(import.meta.url);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ownPackage = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8")) as { name: string; version: string };

function run(binary: string, args: string[], cwd: string, env = process.env, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((accept, reject) => {
    const grouped = process.platform !== "win32";
    const child = spawn(binary, args, { cwd, env, stdio: "inherit", shell: false, detached: grouped });
    let forced: ReturnType<typeof setTimeout> | undefined;
    const terminate = (signal: NodeJS.Signals) => { try { if (grouped && child.pid) process.kill(-child.pid, signal); else child.kill(signal); } catch { /* Already exited. */ } };
    const interrupt = () => { terminate("SIGTERM"); forced = setTimeout(() => terminate("SIGKILL"), 5000); forced.unref(); };
    signal?.addEventListener("abort", interrupt, { once: true });
    if (signal?.aborted) interrupt();
    child.once("error", reject);
    child.once("close", (code, exitSignal) => { clearTimeout(forced); signal?.removeEventListener("abort", interrupt); if (signal?.aborted) reject(signal.reason); else if (code === 0) accept(); else reject(new Error(`Build command failed (${code ?? exitSignal})`)); });
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

export interface BuildOptions {
  assetsDir?: string;
  runtimeAdapter?: string;
  renderer?: string;
  outputDir?: string;
  jarName?: string;
  signal?: AbortSignal;
  port?: number;
  host?: string;
}
export interface ThemeArtifact { theme: string; path: string; sha256: string; bytes: number }

/** Compile React with Keycloakify and atomically publish a native Keycloak JAR. */
export async function buildTheme(config: ThemeConfig, options: BuildOptions = {}): Promise<ThemeArtifact> {
  return await compile("build", config, options) as ThemeArtifact;
}
export async function previewTheme(config: ThemeConfig, options: BuildOptions = {}): Promise<void> {
  await compile("dev", config, options);
}
async function compile(command: "build" | "dev", input: ThemeConfig, options: BuildOptions) {
  let config = parseTheme(input);
  options.signal?.throwIfAborted();
  const assets = options.assetsDir ? await realpath(resolve(options.assetsDir)) : undefined;
  const stylesheet = assets && await exists(join(assets, "theme.css")) ? await asset(assets, "theme.css") : undefined;
  if (assets && await exists(join(assets, "logo.svg"))) {
    config = parseTheme({ ...config, logoUrl: `data:image/svg+xml;base64,${(await readFile(await asset(assets, "logo.svg"))).toString("base64")}` });
  }
  const jar = options.jarName ?? `${config.name}-theme.jar`;
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
    await writeFile(join(work, "bin", "npx"), `#!/usr/bin/env node\nimport{spawnSync}from'node:child_process';const args=process.argv.slice(2);if(args.shift()!=='vite')process.exit(1);const p=spawnSync(process.execPath,[${sourceLiteral(viteBin)},...args],{stdio:'inherit'});process.exit(p.status??1);\n`, { mode: 0o755 });
    if (assets && await exists(join(assets, "OFL.txt"))) await copyFile(await asset(assets, "OFL.txt"), join(work, "public", "licenses", "OFL.txt"));
    const adapter = options.runtimeAdapter ? await realpath(resolve(options.runtimeAdapter)) : undefined;
    const renderer = options.renderer ? await realpath(resolve(options.renderer)) : undefined;
    const pageImport = renderer ?? fileURLToPath(new URL("./keycloak.js", import.meta.url));
    const rendererImport = renderer ? `import KeycloakPage from ${sourceLiteral(pageImport)};` : `import {KeycloakPage} from ${sourceLiteral(pageImport)};`;
    const cssImport = stylesheet ? `import css from ${sourceLiteral(stylesheet + "?inline")};` : 'const css = undefined;';
    const loaderImport = adapter ? `import loader from ${sourceLiteral(adapter)};` : 'const loader = undefined;';
    const keycloakify = JSON.parse(await readFile(require.resolve("keycloakify/package.json"), "utf8")) as { version: string };
    await writeFile(join(work, "package.json"), JSON.stringify({ name: `${config.name}-login-theme`, private: true, type: "module", version: ownPackage.version, dependencies: { [ownPackage.name]: ownPackage.version, keycloakify: keycloakify.version } }, null, 2));
    await writeFile(join(source, "theme-config.ts"), `export default ${sourceLiteral(config)} as const;\n`);
    await writeFile(join(source, "login", "KcPage.tsx"), `${rendererImport}import config from '../theme-config';${cssImport}${loaderImport}\nexport default function KcPage({kcContext}){return <KeycloakPage kcContext={kcContext} config={config} css={css} loader={loader} persistMode/>;}\n`);
    await writeFile(join(source, "login", "KcContext.ts"), `export type {KcContext} from 'keycloakify/login/KcContext';\n`);
    // Keycloakify discovers extra languages from the generated theme source.
    // Keep its static message extraction in sync with the runtime renderer.
    await mkdir(join(source, "login", "messages"));
    const hebrewSource = Object.entries(hebrewMessages).map(([key, value]) => `  ${sourceLiteral(key)}: ${sourceLiteral(value)},`).join("\n");
    await writeFile(join(source, "login", "messages", "he.ts"), `const messages = {\n${hebrewSource}\n};\nexport default messages;\n`);
    await writeFile(join(source, "login", "i18n.ts"), `import {i18nBuilder} from 'keycloakify/login';\nexport const {useI18n}=i18nBuilder.withExtraLanguages({he:{label:'עברית',getMessages:()=>import('./messages/he')}}).build();\n`);
    const previewImport = fileURLToPath(new URL("./workbench.js", import.meta.url));
    await writeFile(join(source, "main.tsx"), `import {createRoot} from 'react-dom/client';${rendererImport}import KcPage from './login/KcPage';const root=createRoot(document.getElementById('root')!);if(import.meta.env.DEV&&!window.kcContext){import(${sourceLiteral(previewImport)}).then(({ThemeWorkbench})=>root.render(<ThemeWorkbench config={config} css={css} renderer={KeycloakPage}/>));}else{root.render(<KcPage kcContext={window.kcContext}/>);}import config from './theme-config';${cssImport}\n`);
    const documentTitle = command === "dev" ? "Theme preview" : config.headline || config.name;
    await writeFile(join(work, "index.html"), `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${htmlText(documentTitle)}</title><style>html,body{margin:0;min-height:100%}</style></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
    await writeFile(join(work, "vite.config.ts"), `import{defineConfig}from'vite';import react from'@vitejs/plugin-react';import{keycloakify}from'keycloakify/vite-plugin';export default defineConfig({cacheDir:${sourceLiteral(join(work,'.vite'))},resolve:{dedupe:['react','react-dom']},optimizeDeps:{include:['keycloakify/login/i18n/messages_defaultSet/en']},build:{assetsInlineLimit:131072},server:{fs:{allow:${sourceLiteral([work, packageRoot, modules, ...(assets ? [assets] : []), ...(adapter ? [dirname(adapter)] : []), ...(renderer ? [dirname(renderer)] : [])])}}},plugins:[react(),keycloakify({themeName:${sourceLiteral(config.name)},accountThemeImplementation:'none',keycloakVersionTargets:{'22-to-25':false,'all-other-versions':${sourceLiteral(jar)}}})]});\n`);
    const env = { ...process.env, XDG_CACHE_HOME: process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), PATH: `${join(work, "bin")}${sep === "/" ? ":" : ";"}${process.env.PATH ?? ""}` };
    if (command === "dev") {
      const port = String(options.port ?? 5173); if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid preview port");
      await run(process.execPath, [viteBin, "--host", options.host ?? "127.0.0.1", "--port", port, "--strictPort"], work, env, options.signal);
    } else {
      await run(process.execPath, [viteBin, "build"], work, env, options.signal);
      await run(process.execPath, [keycloakBin, "build"], work, env, options.signal);
      const output = resolve(options.outputDir ?? "dist_keycloak"); await mkdir(output, { recursive: true });
      const bytes = await readFile(join(work, "dist_keycloak", jar));
      const temporary = join(output, `.${jar}.${randomUUID()}.tmp`);
      try { await copyFile(join(work, "dist_keycloak", jar), temporary); await rename(temporary, join(output, jar)); } finally { await rm(temporary, { force: true }); }
      const path = join(output, jar);
      return { theme: config.name, path, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength };
    }
  } finally { await rm(work, { recursive: true, force: true }); }
}
