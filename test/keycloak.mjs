import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { randomUUID, createHash, createHmac } from "node:crypto";
import { chromium } from "playwright";

const jar = resolve(process.env.THEME_JAR ?? "artifacts/aurora-theme.jar");
const matrix = JSON.parse(await readFile(new URL('./keycloak-matrix.json', import.meta.url), 'utf8'));
const image = process.env.KEYCLOAK_IMAGE || matrix.at(-1).image;
const themeName = process.env.THEME_NAME || "aurora";
assert.match(themeName, /^[a-z0-9][a-z0-9._-]{0,63}$/);
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
    realm: "theme-test", enabled: true, loginTheme: themeName, registrationAllowed: true, resetPasswordAllowed: true,
    internationalizationEnabled: true, supportedLocales: ["en", "fr"], defaultLocale: process.env.THEME_REGISTRATION_EMAIL_LABEL ? "fr" : "en",
    clients: [{ clientId: "theme-browser", enabled: true, publicClient: true, standardFlowEnabled: true, redirectUris: [callback], attributes: { "post.logout.redirect.uris": "+", "pkce.code.challenge.method": "S256" } }],
    users: [
      { username: "otp-user", enabled: true, email: "otp@example.test", firstName: "Test", lastName: "OTP", credentials: [{ type: "password", value: password, temporary: false }], requiredActions: ["CONFIGURE_TOTP"] },
      { username: "recovery-user", enabled: true, email: "recovery@example.test", firstName: "Test", lastName: "Recovery", credentials: [{ type: "password", value: password, temporary: false }], requiredActions: ["CONFIGURE_RECOVERY_AUTHN_CODES"] },
      { username: "profile-user", enabled: true, email: "profile@example.test", firstName: "Alex", lastName: "Profile", credentials: [{ type: "password", value: password, temporary: false }] },
    ],
  }));
  docker("create", "--name", name, "-p", "127.0.0.1::8080", image, "start-dev", "--import-realm", "--features=recovery-codes");
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
  async function login(username, action) {
    const verifier = randomUUID() + randomUUID();
    const auth = new URL(`${issuer}/protocol/openid-connect/auth`);
    auth.search = new URLSearchParams({ client_id: "theme-browser", redirect_uri: callback, response_type: "code", scope: "openid", state: "auth-state", code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
    if (action) auth.searchParams.set("kc_action", action);
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

  if (process.env.THEME_REGISTRATION_EMAIL_LABEL) {
    const auth = new URL(`${issuer}/protocol/openid-connect/auth`);
    auth.search = new URLSearchParams({client_id:"theme-browser",redirect_uri:callback,response_type:"code",scope:"openid",ui_locales:"fr",code_challenge:createHash("sha256").update(randomUUID()+randomUUID()).digest("base64url"),code_challenge_method:"S256"}).toString();
    await page.goto(auth.href);
    if(process.env.THEME_COMPOSITION_LAYOUT){const divider=page.locator('.hkc-block[data-block="layout-divider"]');assert.equal(await divider.evaluate(node=>node.style.width),'50%');assert.equal(await divider.locator('hr').evaluate(node=>getComputedStyle(node).height),'3px');assert.equal(await divider.locator('hr').evaluate(node=>getComputedStyle(node).borderTopWidth),'0px');}
    await page.locator('a[href*="registration"]').click();
    await page.locator('#kc-register-form').waitFor();assert.equal(await page.locator('.hkc-root').getAttribute('lang'),'fr');
    await page.locator('label[for="email"]').filter({hasText:process.env.THEME_REGISTRATION_EMAIL_LABEL}).waitFor();
    assert.equal(await page.locator('#kc-register-form').getAttribute('method'),'post');
    console.log("Native registration profile labels and POST form passed");
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
  console.log("Recovery-code enrollment and native logout passed");

  verifier = await login("profile-user", "UPDATE_PROFILE");
  await page.locator('input[name="firstName"]').waitFor();
  await page.locator('input[name="firstName"]').fill("Camille");
  await page.locator('input[name="lastName"]').fill("Updated");
  await page.locator('#kc-form-buttons input[type="submit"]').click();
  await complete(verifier); await logout();
  verifier = await login("profile-user", "UPDATE_PROFILE");
  assert.equal(await page.locator('input[name="firstName"]').inputValue(), "Camille");
  assert.equal(await page.locator('input[name="lastName"]').inputValue(), "Updated");
  await page.locator('#kc-form-buttons input[type="submit"]').click();
  await complete(verifier); await logout();
  console.log("Native self-service profile updated and persisted without administrator credentials");
  assert.deepEqual(errors, []);
  if (process.env.QUALIFICATION_OUTPUT) await writeFile(process.env.QUALIFICATION_OUTPUT, JSON.stringify({status:'passed',image,theme:themeName,jarSha256:createHash('sha256').update(await readFile(jar)).digest('hex'),checks:[...(process.env.THEME_REGISTRATION_EMAIL_LABEL?['registration-labels']:[]),...(process.env.THEME_COMPOSITION_LAYOUT?['authored-block-dimensions']:[]),'native-OTP-enrollment-and-QR','invalid-OTP-refused','valid-OTP-login','OIDC-code-exchange','logout','recovery-codes','persisted-profile']}, null, 2)+'\n');
} finally {
  await browser?.close();
  await new Promise(resolve => callbackServer.close(resolve));
  try { docker("rm", "-f", name); } catch {}
  await rm(work, { recursive: true, force: true });
}
