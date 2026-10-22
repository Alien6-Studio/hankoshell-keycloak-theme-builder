import type { ClassKey } from "keycloakify/login/lib/kcClsx";

/** Keep upstream Keycloak forms and scripts, with the shared theme's controls. */
export const classes = {
  kcFormClass: "hk-form",
  kcFormGroupClass: "hk-field",
  kcLabelClass: "hk-label",
  kcInputClass: "hk-input",
  kcTextareaClass: "hk-input hk-textarea",
  kcInputGroup: "hk-input-wrap",
  kcInputErrorMessageClass: "hk-alert hk-alert--error",
  kcFormPasswordVisibilityButtonClass: "hk-pw-toggle",
  kcFormPasswordVisibilityIconShow: "hk-password-eye",
  kcFormPasswordVisibilityIconHide: "hk-password-eye hk-password-eye--hidden",
  kcButtonClass: "hk-btn",
  kcButtonDefaultClass: "hk-btn--outline",
  kcButtonSecondaryClass: "hk-btn--outline",
  kcFormOptionsClass: "hk-options",
  kcInputHelperTextBeforeClass: "hk-help",
  kcInputHelperTextAfterClass: "hk-help",
  kcLoginOTPListClass: "hk-authenticator-item",
  kcSelectAuthListItemClass: "hk-authenticator-item",
  kcSelectAuthListItemHeadingClass: "hk-label",
  kcSelectAuthListItemDescriptionClass: "hk-help",
  kcRecoveryCodesWarning: "hk-alert hk-alert--warning",
  kcRecoveryCodesList: "hk-recovery-codes",
  kcRecoveryCodesActions: "hk-actions",
  kcSrOnlyClass: "hk-sr-only",
} satisfies Partial<Record<ClassKey, string>>;
