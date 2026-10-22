import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { parseExperience, parseAppearance, applyAppearance } from "../dist/experience.js";
import { prepareThemeArtifact } from "../dist/artifact.js";
import { createThemeLoader } from "../dist/index.js";

test("new compiled experience modules do not change the transport contract", () => {
  const manifest = { contract: "hanko.experience/v1", id: "example", version: "1.0.0", surfaces: [
    { id: "profile", kind: "self-service", capabilities: ["profile.read"] },
    { id: "agents", kind: "administration", capabilities: ["agents.read", "delegations.read"] },
  ] };
  assert.deepEqual(parseExperience(manifest), manifest);
  assert.throws(() => parseExperience({ ...manifest, script: "https://example.invalid/plugin.js" }));
  assert.throws(() => parseExperience({ ...manifest, surfaces: [manifest.surfaces[0], manifest.surfaces[0]] }));
  assert.throws(() => parseExperience({ ...manifest, contract: "unknown" }));
});

test("appearance profiles preserve new module data while keeping identity and endpoints fixed", () => {
  const profile = { contract: "hanko.appearance/v1", revision: "sha256:123", appearance: { colors: { dark: { primary: "#123456" } }, modules: { agents: { title: "My agents", columns: ["name", "delegation"] } } } };
  const config = applyAppearance({ version: 1, name: "installed", runtime: { endpoint: "/appearance" } }, profile);
  assert.equal(config.name, "installed"); assert.equal(config.runtime.endpoint, "/appearance");
  assert.equal(config.modules.agents.title, "My agents");
  for (const field of ["name", "runtime", "renderer", "version"]) assert.throws(() => parseAppearance({ ...profile, appearance: { [field]: "forged" } }));
  assert.throws(() => parseAppearance({ ...profile, appearance: { modules: JSON.parse('{"profile":{"__proto__":{"polluted":true}}}') } }));
  assert.throws(() => parseAppearance({ ...profile, appearance: { modules: { profile: { text: "€".repeat(22000) } } } }));
});

test("the default runtime loader consumes versioned profiles without a private adapter", async () => {
  const load = createThemeLoader({endpoint:"/appearance/{realm}/{clientId}"}, async url => {
    assert.equal(url,"/appearance/example/app");
    return new Response(JSON.stringify({contract:"hanko.appearance/v1",revision:"1",appearance:{modules:{profile:{compact:true}},headline:"Published"}}));
  });
  const config = await load({realm:"example",clientId:"app",signal:new AbortController().signal});
  assert.equal(config.headline,"Published"); assert.equal(config.modules.profile.compact,true);
});

test("release packaging binds exact compiled bytes and refuses mutable installer images", async () => {
  const root = await mkdtemp(join(tmpdir(), "theme-release-"));
  try {
    const path = join(root, "theme.jar"); const bytes = Buffer.from("example compiled bytes"); await writeFile(path, bytes);
    const artifact = { theme: "example", path, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length };
    const options = { outputDir: join(root, "context"), version: "1.0.0", installerBaseImage: `registry.example/installer@sha256:${"a".repeat(64)}` };
    const manifest = await prepareThemeArtifact(artifact, options);
    assert.equal(manifest.contract, "hanko.theme-artifact/v1");
    assert.deepEqual(await readFile(join(options.outputDir, "theme.jar")), bytes);
    assert.equal(JSON.parse(await readFile(join(options.outputDir, "theme-artifact.json"))).jar.sha256, artifact.sha256);
    await assert.rejects(prepareThemeArtifact(artifact, { ...options, installerBaseImage: "alpine:latest" }));
    await writeFile(path, "tampered");
    await assert.rejects(prepareThemeArtifact(artifact, { ...options, outputDir: join(root, "forged") }));
  } finally { await rm(root, { recursive: true, force: true }); }
});
