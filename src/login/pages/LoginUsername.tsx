import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext.js";
import type { I18n } from "../i18n.js";
import { useThemeConfig } from "../../shared/ThemeContext.js";
import {
  RegistrationLink,
  RememberMeCheckbox,
  SocialDivider,
  SocialProviders,
  UsernameField,
} from "./LoginShared.js";

type KcContextLoginUsername = Extract<KcContext, { pageId: "login-username.ftl" }>;
type Props = PageProps<KcContextLoginUsername, I18n>;

// LoginUsername renders the identity-first first step Keycloak serves when
// organizations are enabled on the realm: username/email only, the password or
// broker redirect comes on the next step once the organization is resolved.
export default function LoginUsername({ kcContext, i18n, doUseDefaultCss, Template }: Readonly<Props>) {
  const { realm, url, usernameHidden, login, social, registrationDisabled } = kcContext;
  const { msgStr } = i18n;
  const { social_position = "after" } = useThemeConfig();

  const socialProviders = social?.providers ?? [];
  const hasSocial = socialProviders.length > 0;
  const socialFirst = hasSocial && social_position === "before";

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={socialFirst ? null : msgStr("loginAccountTitle")}
    >
      {socialFirst && (
        <>
          <SocialProviders providers={socialProviders} />
          <SocialDivider i18n={i18n} margin="1rem 0" />
        </>
      )}

      <form
        id="kc-form-login"
        action={url.loginAction}
        method="post"
        className="hk-form"
      >
        {!usernameHidden && (
          <UsernameField
            realm={realm}
            i18n={i18n}
            defaultValue={login.username ?? ""}
            autoFocus
          />
        )}

        {realm.rememberMe && !usernameHidden && (
          <div className="hk-row">
            <RememberMeCheckbox i18n={i18n} defaultChecked={login.rememberMe === "on"} />
          </div>
        )}

        <button
          type="submit"
          name="login"
          className="hk-btn"
          style={{ marginTop: "0.25rem" }}
        >
          {msgStr("doLogIn")}
        </button>
      </form>

      {!socialFirst && hasSocial && (
        <>
          <SocialDivider i18n={i18n} margin="1.25rem 0 1rem" />
          <SocialProviders providers={socialProviders} />
        </>
      )}

      {realm.registrationAllowed && !registrationDisabled && (
        <RegistrationLink i18n={i18n} registrationUrl={url.registrationUrl} />
      )}
    </Template>
  );
}
