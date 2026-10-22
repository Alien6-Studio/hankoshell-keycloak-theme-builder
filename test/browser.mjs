import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { authenticationPages } from "../dist/index.js";

const origin = "http://127.0.0.1:5189";
const server = spawn(process.execPath, ["dist/cli.js", "dev", "examples/aurora/theme.json", "--renderer", "examples/aurora/BrandPage.tsx", "--port", "5189"], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
server.stdout.on("data", chunk => { output += chunk; }); server.stderr.on("data", chunk => { output += chunk; });
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (attempt === 100 || server.exitCode !== null) throw new Error(`Preview did not start: ${output}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; const external = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => { if (!request.url().startsWith(origin) && !request.url().startsWith("data:")) external.push(request.url()); });
  await page.goto(origin);
  await page.locator(".hk-card").waitFor();
  assert.equal(await page.locator('[data-example-brand="aurora"]').count(), 1);
  for (const locale of ["en", "fr"]) {
    await page.getByLabel("Language", { exact: true }).selectOption(locale);
    for (const id of authenticationPages) {
      await page.getByLabel("Page", { exact: true }).selectOption(id);
      const preview = page.locator(`[data-preview-page="${id}"]`);
      await preview.locator(".hk-card").waitFor();
      for (const mode of ["dark", "light"]) {
        await page.getByLabel("Appearance", { exact: true }).selectOption(mode);
        await preview.locator(`.hk-page[data-mode="${mode}"]`).waitFor();
        assert.equal(await preview.locator(".hk-logo-title").innerText(), "Aurora");
        assert.equal(await preview.evaluate(host => host.scrollWidth <= host.clientWidth), true, `${id}: horizontal overflow`);
      }
      if (id === "login-config-totp.ftl") {
        assert.equal(await preview.locator("#kc-totp-secret-qr-code").count(), 1);
        assert.ok(await preview.locator('[name="totpSecret"]').inputValue());
        assert.equal(await preview.locator('[name="totp"]').count(), 1);
      }
      if (id === "login-otp.ftl") {
        assert.equal(await preview.locator('[name="otp"]').getAttribute("autocomplete"), "one-time-code");
        assert.equal(await preview.locator('[name="selectedCredentialId"]').count(), 1);
      }
      if (id === "login-recovery-authn-code-config.ftl") {
        const save = preview.locator("#saveRecoveryAuthnCodesBtn");
        assert.equal(await save.isDisabled(), true);
        await preview.locator("#kcRecoveryCodesConfirmationCheck").check();
        assert.equal(await save.isEnabled(), true);
        assert.ok(await preview.locator('[name="generatedRecoveryAuthnCodes"]').inputValue());
      }
      if (id === "logout-confirm.ftl") {
        assert.ok(await preview.locator('[name="session_code"]').inputValue());
        const before = page.url(); await preview.locator('[name="confirmLogout"]').click(); assert.equal(page.url(), before);
      }
      console.log(`${locale}: ${id}`);
    }
  }
  await page.getByLabel("Surface", { exact: true }).selectOption("self-service");
  await page.getByRole("heading", { name: "Mon profil", exact: true }).waitFor();
  assert.equal(await page.getByLabel("Username", { exact: true }).isEditable(), false);
  assert.equal(await page.getByLabel("Email", { exact: true }).isEditable(), false);
  await page.getByLabel(/^First name/).fill("Camille");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Vos informations ont été enregistrées." }).waitFor();
  await page.getByLabel(/^First name/).fill("Unsaved");
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  assert.equal(await page.getByLabel(/^First name/).inputValue(), "Camille");
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log(`${authenticationPages.length} pages × 2 languages × 2 appearances; no browser errors or external requests`);
} finally {
  await browser?.close();
  server.kill("SIGINT");
  await new Promise(resolve => server.exitCode !== null ? resolve() : server.once("close", resolve));
}
