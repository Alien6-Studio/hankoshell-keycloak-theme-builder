import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ThemeArtifact } from "./builder.js";
import { parseExperience, type ExperienceManifest } from "./experience.js";

export interface ThemeArtifactManifest {
  contract: "hanko.theme-artifact/v1";
  name: string;
  version: string;
  keycloakMajor: 26;
  jar: { path: "/theme/theme.jar"; sha256: string; bytes: number };
  experience?: ExperienceManifest;
}
export interface ArtifactOptions {
  outputDir: string;
  version: string;
  /** Reviewed shell/cp/sha256sum image; the caller owns registry policy. */
  installerBaseImage: string;
  experience?: ExperienceManifest;
}

/** Build once centrally. The resulting OCI image only installs already compiled bytes. */
export async function prepareThemeArtifact(artifact: ThemeArtifact, options: ArtifactOptions): Promise<ThemeArtifactManifest> {
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(artifact.theme) || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(options.version)) throw new Error("Invalid artifact identity");
  if (!/^[a-z0-9][a-z0-9./:_-]+@sha256:[a-f0-9]{64}$/.test(options.installerBaseImage)) throw new Error("The installer base image must be pinned by SHA-256 digest");
  const bytes = await readFile(artifact.path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== artifact.sha256 || bytes.length !== artifact.bytes) throw new Error("Compiled theme bytes do not match the build result");
  const manifest: ThemeArtifactManifest = { contract: "hanko.theme-artifact/v1", name: artifact.theme, version: options.version, keycloakMajor: 26, jar: { path: "/theme/theme.jar", sha256, bytes: bytes.length }, ...(options.experience ? { experience: parseExperience(options.experience) } : {}) };
  const output = resolve(options.outputDir); await mkdir(output, { recursive: true });
  // Exclusive writes refuse an old build context rather than mixing releases.
  await writeFile(join(output, "theme.jar"), bytes, { flag: "wx" });
  await writeFile(join(output, "theme-artifact.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
  await writeFile(join(output, "build-theme.sh"), installer(manifest), { flag: "wx", mode: 0o755 });
  await writeFile(join(output, "Dockerfile"), `FROM ${options.installerBaseImage}\nCOPY theme.jar theme-artifact.json /theme/\nCOPY --chmod=755 build-theme.sh /build-theme.sh\nUSER 10001:10001\nENTRYPOINT ["/bin/sh", "/build-theme.sh"]\n`, { flag: "wx" });
  return manifest;
}

function installer(manifest: ThemeArtifactManifest): string {
  return `#!/bin/sh
set -eu
# Stable HankoTheme execution contract: no Node, Maven or network access.
test "\${THEME_SLUG:?missing theme identity}" = '${manifest.name}'
name="\${THEME_JAR_NAME:?missing output JAR name}"
case "$name" in ''|*[!a-zA-Z0-9._-]*|.*) exit 2;; esac
case "$name" in *.jar) ;; *) exit 2;; esac
test -d /output
temporary="$(mktemp /output/.hanko-theme.XXXXXXXX)"
trap 'rm -f "$temporary"' EXIT HUP INT TERM
cp /theme/theme.jar "$temporary"
printf '%s  %s\n' '${manifest.jar.sha256}' "$temporary" | sha256sum -c -
chmod 0644 "$temporary"
mv -f "$temporary" "/output/$name"
`;
}
