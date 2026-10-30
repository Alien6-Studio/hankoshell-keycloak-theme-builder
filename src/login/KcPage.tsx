import { Suspense, lazy } from "react";
import type { KcContext } from "./KcContext.js";
import { useI18n } from "./i18n.js";
import { classes } from "./classes.js";
import { usePresentation } from "../presentation.js";
import { useComposition, compositionI18n } from "../composition-model.js";


const DefaultPage = lazy(() => import("keycloakify/login/DefaultPage"));
const UserProfileFormFields = lazy(() => import("keycloakify/login/UserProfileFormFields"));
const Template = lazy(() => import("./Template.js"));
const LoginUsername = lazy(() => import("./pages/LoginUsername.js"));
const LoginPassword = lazy(() => import("./pages/LoginPassword.js"));

const SharedLogoutConfirm = lazy(() => import("../shared/pages/LogoutConfirm.js"));
const SharedError = lazy(() => import("../shared/pages/Error.js"));
const SharedInfo = lazy(() => import("../shared/pages/Info.js"));
const SharedLoginPageExpired = lazy(() => import("../shared/pages/LoginPageExpired.js"));
const SharedLoginResetPassword = lazy(() => import("../shared/pages/LoginResetPassword.js"));
const SharedLoginUpdatePassword = lazy(() => import("../shared/pages/LoginUpdatePassword.js"));
const SharedLoginVerifyEmail = lazy(() => import("../shared/pages/LoginVerifyEmail.js"));
const SharedLoginOtp = lazy(() => import("../shared/pages/LoginOtp.js"));
const SharedSelectAuthenticator = lazy(() => import("../shared/pages/SelectAuthenticator.js"));
const SharedLoginIdpLinkConfirm = lazy(() => import("../shared/pages/LoginIdpLinkConfirm.js"));
const RecoveryCodes = lazy(() => import("../shared/pages/RecoveryCodes.js"));
const WebauthnPreview = lazy(() => import("../shared/pages/WebauthnPreview.js"));
const CredentialPreview = lazy(() => import("../shared/pages/CredentialPreview.js"));

type Props = {
  kcContext: KcContext;
};

export default function KcPage({ kcContext }: Readonly<Props>) {
  const { i18n: originalI18n } = useI18n({ kcContext });
  const composition = useComposition();
  const i18n = compositionI18n(originalI18n, kcContext.pageId, composition);
  const { preview } = usePresentation();

  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case "login-recovery-authn-code-config.ftl":
            return <RecoveryCodes kcContext={kcContext} i18n={i18n} Template={Template} doUseDefaultCss={false} />;
          case "webauthn-authenticate.ftl":
          case "webauthn-register.ftl":
          case "webauthn-error.ftl":
            if (preview) return <WebauthnPreview kcContext={kcContext} i18n={i18n} Template={Template} doUseDefaultCss={false} />;
            return <DefaultPage kcContext={kcContext} i18n={i18n} Template={Template} classes={classes} UserProfileFormFields={UserProfileFormFields} doMakeUserConfirmPassword={false} doUseDefaultCss={false} />;
          case "login.ftl":
            if (preview) return <CredentialPreview kcContext={kcContext} i18n={i18n} Template={Template} doUseDefaultCss={false} />;
            return <DefaultPage kcContext={kcContext} i18n={i18n} Template={Template} classes={classes} UserProfileFormFields={UserProfileFormFields} doMakeUserConfirmPassword={false} doUseDefaultCss={false} />;
          case "login-username.ftl":
            return (
              <LoginUsername
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-password.ftl":
            if (preview) return <CredentialPreview kcContext={kcContext} i18n={i18n} Template={Template} doUseDefaultCss={false} />;
            return (
              <LoginPassword
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "logout-confirm.ftl":
            return (
              <SharedLogoutConfirm
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "error.ftl":
            return (
              <SharedError
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "info.ftl":
            return (
              <SharedInfo
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-page-expired.ftl":
            return (
              <SharedLoginPageExpired
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-reset-password.ftl":
            return (
              <SharedLoginResetPassword
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-update-password.ftl":
            return (
              <SharedLoginUpdatePassword
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-verify-email.ftl":
            return (
              <SharedLoginVerifyEmail
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-otp.ftl":
            return (
              <SharedLoginOtp
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "select-authenticator.ftl":
            return (
              <SharedSelectAuthenticator
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "login-idp-link-confirm.ftl":
            return (
              <SharedLoginIdpLinkConfirm
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                doUseDefaultCss={false}
              />
            );
          case "register.ftl":
            if (preview) return <CredentialPreview kcContext={kcContext} i18n={i18n} Template={Template} doUseDefaultCss={false} />;
            return <DefaultPage kcContext={kcContext} i18n={i18n} Template={Template} classes={classes} UserProfileFormFields={UserProfileFormFields} doMakeUserConfirmPassword={false} doUseDefaultCss={false} />;
          default:
            return (
              <DefaultPage
                kcContext={kcContext}
                i18n={i18n}
                Template={Template}
                classes={classes}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword={false}
                doUseDefaultCss={false}
              />
            );
        }
      })()}
    </Suspense>
  );
}
