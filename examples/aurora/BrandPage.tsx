import { KeycloakPage, type KeycloakPageProps } from "@alien6/hankoshell-keycloak-theme-builder/keycloak";

// Own the React layout while retaining native authentication and MFA handling.
export default function BrandPage(props: KeycloakPageProps) {
  return <div data-example-brand="aurora"><KeycloakPage {...props} /></div>;
}
