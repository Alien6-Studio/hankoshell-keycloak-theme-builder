import KeycloakLoginPassword from "keycloakify/login/pages/LoginPassword";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext.js";
import type { I18n } from "../i18n.js";

type Props = PageProps<Extract<KcContext, { pageId: "login-password.ftl" }>, I18n>;

// Keep Keycloakify's submission, field errors and conditional passkey flow.
// Map its form controls onto the same styles as the identity-first username page.
export default function LoginPassword(props: Readonly<Props>) {
  return (
    <div className="hk-password-page">
      <KeycloakLoginPassword
        {...props}
        classes={{
          kcFormGroupClass: "hk-field",
          kcLabelClass: "hk-label",
          kcInputClass: "hk-input hk-input--padded",
          kcInputGroup: "hk-input-wrap",
          kcInputErrorMessageClass: "hk-alert hk-alert--error",
          kcFormPasswordVisibilityButtonClass: "hk-pw-toggle",
          kcFormPasswordVisibilityIconShow: "hk-password-eye",
          kcFormPasswordVisibilityIconHide: "hk-password-eye hk-password-eye--hidden",
          kcButtonClass: "hk-btn",
          kcButtonDefaultClass: "hk-btn--outline",
        }}
      />
    </div>
  );
}
