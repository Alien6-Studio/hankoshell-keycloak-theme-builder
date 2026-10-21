import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { randomUUID, createHash, createHmac } from "node:crypto";
import { chromium } from "playwright";

const jar = resolve(process.env.THEME_JAR ?? "artifacts/aurora-theme.jar");
const work = await mkdtemp(join(tmpdir(), "theme-keycloak-"));
const name = `theme-kit-${randomUUID().slice(0, 8)}`;
const password = randomUUID();
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let browser;
const callbackServer = createServer((_request, response) => { response.writeHead(200, { "Content-Type": "text/plain" }); response.end("OIDC callback"); });
await new Promise(resolve => callbackServer.listen(0, "127.0.0.1", resolve));
const callback = `http://127.0.0.1:${callbackServer.address().port}/callback`;

function otp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.replace(/=+$/, "").toUpperCase()].map(char => alphabet.indexOf(char).toString(2).padStart(5, "0")).join("");
  const bytes = Buffer.from(bits.match(/.{8}/g).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", bytes).update(counter).digest(); const offset = hash.at(-1) & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}

try {
  await chmod(work, 0o755);
  await writeFile(join(work, "theme-test-realm.json"), JSON.stringify({
    realm: "theme-test", enabled: true, loginTheme: "aurora", registrationAllowed: true, resetPasswordAllowed: true,
    internationalizationEnabled: true, supportedLocales: ["en", "fr"], defaultLocale: "en",
    clients: [{ clientId: "theme-browser", enabled: true, publicClient: true, standardFlowEnabled: true, redirectUris: [callback], attributes: { "post.logout.redirect.uris": "+", "pkce.code.challenge.method": "S256" } }],
    users: [
      { username: "otp-user", enabled: true, email: "otp@example.test", firstName: "Test", lastName: "OTP", credentials: [{ type: "password", value: password, temporary: false }], requiredActions: ["CONFIGURE_TOTP"] },
      { username: "recovery-user", enabled: true, email: "recovery@example.test", firstName: "Test", lastName: "Recovery", credentials: [{ type: "password", value: password, temporary: false }], requiredActions: ["CONFIGURE_RECOVERY_AUTHN_CODES"] },
    ],
  }));
  docker("create", "--name", name, "-p", "127.0.0.1::8080", process.env.KEYCLOAK_IMAGE ?? "quay.io/keycloak/keycloak:26.7.3", "start-dev", "--import-realm", "--features=recovery-codes");
  docker("cp", jar, `${name}:/opt/keycloak/providers/aurora-theme.jar`);
  docker("cp", `${work}/.`, `${name}:/opt/keycloak/data/import`);
  docker("start", name);
  const address = docker("port", name, "8080/tcp"); const origin = `http://${address}`;
  const issuer = `${origin}/realms/theme-test`;
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(2000) })).ok) break; } catch {}
    if (docker("inspect", "--format", "{{.State.Running}}", name) !== "true") throw new Error(`Local Keycloak exited:\n${docker("logs", name, "--tail", "30")}`);
    if (attempt === 120) throw new Error("Local Keycloak did not start");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH, headless: true });
  const context = await browser.newContext(); const page = await context.newPage();
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  async function login(username) {
    const verifier = randomUUID() + randomUUID();
    const auth = new URL(`${issuer}/protocol/openid-connect/auth`);
    auth.search = new URLSearchParams({ client_id: "theme-browser", redirect_uri: callback, response_type: "code", scope: "openid", state: "auth-state", code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
    await page.goto(auth.href); await page.locator("#username").fill(username); await page.locator("#password").fill(password); await page.locator("#kc-login").click();
    return verifier;
  }
  async function complete(verifier) {
    await page.waitForURL(`${callback}*`); const url = new URL(page.url());
    assert.equal(url.searchParams.get("state"), "auth-state");
    const response = await fetch(`${issuer}/protocol/openid-connect/token`, { method: "POST", body: new URLSearchParams({ grant_type: "authorization_code", client_id: "theme-browser", redirect_uri: callback, code: url.searchParams.get("code"), code_verifier: verifier }) });
    assert.equal(response.status, 200); const tokens = await response.json(); assert.ok(tokens.id_token); return tokens;
  }
  async function logout() {
    const url = new URL(`${issuer}/protocol/openid-connect/logout`);
    url.search = new URLSearchParams({ client_id: "theme-browser", post_logout_redirect_uri: callback, state: "logout-state" }).toString();
    await page.goto(url.href); await page.locator('[name="confirmLogout"]').click(); await page.waitForURL(`${callback}*`);
    assert.equal(new URL(page.url()).searchParams.get("state"), "logout-state");
  }

  let verifier = await login("otp-user");
  await page.locator("#kc-totp-settings-form").waitFor();
  assert.equal(await page.locator("#kc-totp-secret-qr-code").evaluate(image => image.complete && image.naturalWidth > 0), true);
  await page.locator("#mode-manual").click();
  const secret = (await page.locator("#kc-totp-secret-key").innerText()).replace(/\s/g, "");
  const enrolledCode = otp(secret);
  await page.locator("#totp").fill(enrolledCode); await page.locator("#userLabel").fill("Theme test"); await page.locator("#saveTOTPBtn").click();
  await complete(verifier); await logout(); console.log("OTP enrollment and native logout passed");

  // A code consumed during enrollment cannot be replayed during login.
  while (otp(secret) === enrolledCode) await new Promise(resolve => setTimeout(resolve, 250));

  verifier = await login("otp-user"); await page.locator("#otp").waitFor();
  const valid = otp(secret); const invalid = `${(Number(valid[0]) + 1) % 10}${valid.slice(1)}`;
  await page.locator("#otp").fill(invalid); await page.locator("#kc-login").click(); await page.locator("#input-error-otp-code").waitFor();
  await page.locator("#otp").fill(otp(secret)); await page.locator("#kc-login").click(); await complete(verifier); await logout();
  console.log("Invalid OTP rejected, valid OTP accepted, OIDC session closed");

  verifier = await login("recovery-user"); await page.locator("#kc-recovery-codes-list").waitFor();
  assert.equal(await page.locator("#saveRecoveryAuthnCodesBtn").isDisabled(), true);
  await page.locator("#kcRecoveryCodesConfirmationCheck").check(); await page.locator("#saveRecoveryAuthnCodesBtn").click(); await complete(verifier); await logout();
  console.log("Recovery-code enrollment and native logout passed"); assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise(resolve => callbackServer.close(resolve));
  try { docker("rm", "-f", name); } catch {}
  await rm(work, { recursive: true, force: true });
}
