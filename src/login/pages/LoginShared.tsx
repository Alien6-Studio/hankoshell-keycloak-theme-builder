import type { I18n } from "../i18n.js";
import { ProviderIcon } from "./ProviderIcon.js";

// Building blocks shared by the one-step (login.ftl) and identity-first
// (login-username.ftl) login pages so both stay visually identical.

type SocialProvider = {
  alias: string;
  loginUrl: string;
  displayName: string;
};

type RealmLike = {
  loginWithEmailAllowed: boolean;
  registrationEmailAsUsername: boolean;
};

export function getUsernameLabel(realm: RealmLike, i18n: I18n): string {
  const { msgStr } = i18n;
  if (!realm.loginWithEmailAllowed) {
    return msgStr("username");
  }
  return realm.registrationEmailAsUsername ? msgStr("email") : msgStr("usernameOrEmail");
}

export function SocialProviders({ providers }: Readonly<{ providers: SocialProvider[] }>) {
  return (
    <div className="hk-social">
      {providers.map(provider => (
        <a key={provider.alias} href={provider.loginUrl} className="hk-btn hk-btn--outline">
          <span className="hk-provider-icon">
            <ProviderIcon alias={provider.alias} />
          </span>
          {provider.displayName}
        </a>
      ))}
    </div>
  );
}

export function SocialDivider({ i18n, margin }: Readonly<{ i18n: I18n; margin: string }>) {
  return (
    <div className="hk-divider" style={{ margin }}>
      <span>{i18n.msgStr("identity-provider-login-label")}</span>
    </div>
  );
}

export function UsernameField({
  realm,
  i18n,
  defaultValue,
  autoFocus,
}: Readonly<{ realm: RealmLike; i18n: I18n; defaultValue: string; autoFocus: boolean }>) {
  return (
    <div className="hk-field">
      <label htmlFor="username" className="hk-label">
        {getUsernameLabel(realm, i18n)}
      </label>
      <input
        id="username"
        name="username"
        type="text"
        className="hk-input"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        autoComplete={realm.loginWithEmailAllowed ? "username email" : "username"}
      />
    </div>
  );
}

export function RememberMeCheckbox({
  i18n,
  defaultChecked,
}: Readonly<{ i18n: I18n; defaultChecked: boolean }>) {
  return (
    <label className="hk-checkbox-label">
      <input type="checkbox" name="rememberMe" defaultChecked={defaultChecked} />
      {i18n.msgStr("rememberMe")}
    </label>
  );
}

export function RegistrationLink({
  i18n,
  registrationUrl,
}: Readonly<{ i18n: I18n; registrationUrl: string }>) {
  return (
    <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--fg-muted)" }}>
      {i18n.msgStr("noAccount")}{" "}
      <a href={registrationUrl} className="hk-link" style={{ color: "var(--primary)" }}>
        {i18n.msgStr("doRegister")}
      </a>
    </p>
  );
}
