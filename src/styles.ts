export const baseCss = ` .hk-page *, .hk-page *::before, .hk-page *::after { box-sizing: border-box; }
/* ── Layout ── */

.hk-page {
  min-height: var(--hk-page-height, 100svh);
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-family);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.hk-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 70% 40% at 50% 0%, var(--ring-glow) 0%, transparent 70%);
}

.hk-container {
  position: relative;
  width: 100%;
  max-width: var(--content-width);
}

/* ── Logo block ── */

.hk-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.hk-logo-title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--fg);
  margin: 0;
}

.hk-brand-mark {
  height: 28px;
  width: auto;
}

.hk-logo-subtitle {
  font-size: 0.875rem;
  color: var(--fg-muted);
  margin: 0.25rem 0 0;
}

/* ── Card ── */

.hk-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 2rem;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  position: relative;
}

/* ── Section header (inside card) ── */

.hk-header {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--fg);
  margin: 0 0 1.25rem;
}

/* ── Alert / message banner ── */

.hk-alert {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.hk-alert--error {
  background: oklch(0.65 0.22 25 / 0.12);
  color: oklch(0.82 0.14 25);
  border: 1px solid oklch(0.65 0.22 25 / 0.25);
}

.hk-alert--info,
.hk-alert--success {
  background: oklch(0.697 0.132 205 / 0.10);
  color: oklch(0.82 0.09 205);
  border: 1px solid oklch(0.697 0.132 205 / 0.25);
}

.hk-alert--warning {
  background: oklch(0.80 0.18 75 / 0.10);
  color: oklch(0.80 0.15 75);
  border: 1px solid oklch(0.80 0.18 75 / 0.25);
}

/* ── Form ── */

.hk-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hk-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.hk-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--fg);
}

.hk-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.hk-input {
  width: 100%;
  height: 2rem;
  padding: 0 0.75rem;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--control-radius);
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--fg);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.hk-input::placeholder { color: var(--fg-muted); }

.hk-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--ring-glow);
}

.hk-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hk-input--padded { padding-right: 2.25rem; }

.hk-pw-toggle {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--fg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.hk-pw-toggle:hover { color: var(--fg); }

/* ── Remember-me / forgot-password row ── */

.hk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.hk-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--fg-muted);
  cursor: pointer;
  user-select: none;
}

.hk-checkbox-label input[type="checkbox"] {
  width: 0.875rem;
  height: 0.875rem;
  accent-color: var(--primary);
}

.hk-link {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.hk-link:hover {
  color: var(--primary);
  text-decoration: underline;
}

/* ── Buttons ── */

.hk-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2.5rem;
  padding: 0 1rem;
  background: var(--primary);
  color: var(--primary-fg);
  border: none;
  border-radius: var(--control-radius);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s;
}

.hk-btn:hover  { opacity: 0.88; }
.hk-btn:active { opacity: 0.76; }

.hk-btn:disabled,
.hk-btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

.hk-btn--outline {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--border);
}

.hk-btn--outline:hover { opacity: 0.8; }

.hk-btn--ghost {
  background: transparent;
  color: var(--fg-muted);
  border: none;
}

.hk-btn--ghost:hover { color: var(--fg); opacity: 1; }

/* ── Divider ── */

.hk-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
}

.hk-divider::before,
.hk-divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--border);
}

.hk-divider span {
  font-size: 0.75rem;
  color: var(--fg-muted);
}

/* ── Social providers ── */

.hk-social {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hk-provider-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Info section (registration link, etc.) ── */

.hk-info {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

/* ── Theme toggle button ── */

.hk-theme-toggle {
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  color: var(--fg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: color 0.15s, background-color 0.15s;
}

.hk-theme-toggle:hover {
  color: var(--fg);
  background-color: oklch(0 0 0 / 0.06);
}

/* ── OTP input ── */

.hk-otp-input {
  text-align: center;
  letter-spacing: 0.25em;
  font-size: 1.25rem;
}

/* ── Authenticator list ── */

.hk-authenticator-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hk-authenticator-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  cursor: pointer;
  background: transparent;
  width: 100%;
  text-align: left;
  color: var(--fg);
  font-family: inherit;
  transition: border-color 0.15s;
}

.hk-authenticator-item:hover {
  border-color: var(--ring);
}

/* ── Scrollbar ── */

.hk-page::-webkit-scrollbar          { width: 5px; height: 5px; }
.hk-page::-webkit-scrollbar-track    { background: transparent; }
.hk-page::-webkit-scrollbar-thumb    { background: oklch(0.35 0 0 / 0.5); border-radius: 10px; }
.hk-page::-webkit-scrollbar-thumb:hover { background: oklch(0.45 0 0 / 0.7); }

/* Identity-first password step keeps the upstream passkey and error handling. */
.hk-password-page #kc-form-login {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hk-password-page #kc-form-login hr { display: none; }

.hk-password-page #kc-form-options a {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.hk-password-eye {
  display: block;
  width: 1rem;
  height: 0.625rem;
  border: 1px solid currentColor;
  border-radius: 70% 20%;
  transform: rotate(45deg);
  position: relative;
}

.hk-password-eye::after {
  content: "";
  position: absolute;
  width: 0.25rem;
  height: 0.25rem;
  background: currentColor;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hk-password-eye--hidden::before {
  content: "";
  position: absolute;
  width: 1px;
  height: 1.25rem;
  background: currentColor;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Keep error text readable on the explicitly selected light surface. */
.hk-page[data-mode="light"] .hk-alert--error { color: #b42318; }
.hk-page[data-mode="light"] .hk-alert--info,
.hk-page[data-mode="light"] .hk-alert--success { color: #12616a; }
.hk-page[data-mode="light"] .hk-alert--warning { color: #854d0e; }

.hk-social .hk-btn { gap: 0.5rem; }

.hk-brand-heading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
.hk-page a { color: var(--primary); overflow-wrap: anywhere; }
.hk-help, .hk-page .subtitle { color: var(--fg-muted); font-size: 0.8125rem; line-height: 1.5; }
.hk-page p, .hk-page li { line-height: 1.5; overflow-wrap: anywhere; }
.hk-page input[type="checkbox"], .hk-page input[type="radio"] { accent-color: var(--primary); }
.hk-page :focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
.hk-options, .hk-alternative, .hk-identity { margin-block: 1rem; font-size: 0.875rem; }
.hk-alternative button { background: none; border: 0; padding: 0; font-family: inherit; cursor: pointer; }
.hk-page #kc-totp-settings { padding-inline-start: 1.25rem; font-size: 0.875rem; }
.hk-page #kc-totp-settings li { margin-block: 0.75rem; }
.hk-page #kc-totp-secret-qr-code { display: block; max-width: 100%; height: auto; padding: 0.5rem; background: white; }
.hk-page #kc-totp-secret-key { display: block; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--control-radius); font-family: monospace; overflow-wrap: anywhere; user-select: all; }
.hk-page #kc-totp-settings-form .hk-btn { margin-block: 0.5rem; }
.hk-recovery-codes { list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; padding: 1rem 0; font-family: monospace; font-size: 0.8125rem; }
.hk-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.hk-actions .hk-btn { flex: 1; width: auto; min-width: 5rem; padding-inline: 0.5rem; }
.hk-textarea { min-height: 6rem; padding-block: 0.5rem; }
.hk-sr-only, .hk-page .pf-screen-reader { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 380px) { .hk-card { padding: 1.25rem; } .hk-recovery-codes { grid-template-columns: 1fr; } }
`;
