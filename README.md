# Hankoshell Keycloak Theme Builder

Build native Keycloak themes from React and brand configuration. Preview them locally, compile a JAR through the CLI or Node API, and publish appearance changes without rebuilding. Use it independently or embed it in your platform; no Hanko services or credentials are required.

[![CI](https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

## Try it

Requires Node.js 22+. Building a JAR also requires Java 21 and Maven. From a checkout:

```sh
npm ci
npm run build
node dist/cli.js init theme.json
node dist/cli.js dev theme.json
node dist/cli.js build theme.json --out dist_keycloak
```

The local gallery offers login, registration, OTP setup with QR code, OTP verification/reset, authenticator selection, recovery codes, WebAuthn, password recovery, email verification and logout. It includes English/French previews and light/dark modes. Authentication forms cannot submit in the gallery; passkey previews do not invoke an authenticator.

This package is not yet published to npm. Until its first release, consumers can install a reviewed Git commit:

```sh
npm install 'git+https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder.git#<commit>'
```

Future tagged releases provide a package tarball, example JAR, SHA-256 checksums and GitHub build attestations. Verify downloaded assets with `gh attestation verify <file> --repo Alien6-Studio/hankoshell-keycloak-theme-builder`.

## Brand configuration

```json
{
  "version": 1,
  "name": "aurora",
  "headline": "Aurora",
  "subline": "Welcome back",
  "colors": {
    "dark": { "primary": "#38bdf8", "primaryForeground": "#0b1220" },
    "light": { "primary": "#2563eb" }
  },
  "layout": { "cardRadius": "16px", "controlRadius": "12px" }
}
```

Use `--assets ./brand` to bundle `logo.svg`, trusted `theme.css`, fonts referenced by that CSS, and an optional `OFL.txt` license. Keep customer assets and deployment configuration in your own project. Remote logos must use HTTPS; embedded assets avoid external requests during authentication.

## React themes

Provide your own React renderer as a local module exporting a component with `KeycloakPageProps`. It can reuse `KeycloakPage` and customize selected pages or supply its own layout. See [`BrandPage.tsx`](examples/aurora/BrandPage.tsx).

```sh
node dist/cli.js dev theme.json --renderer ./BrandPage.tsx
node dist/cli.js build theme.json --renderer ./BrandPage.tsx
```

The Node API accepts the same `renderer` path. Pass that component to `ThemePreview` to preview the same React code. Renderers and runtime adapters are trusted build inputs; appearance JSON cannot select executable modules.

## Dashboard preview

```tsx
import { ThemePreview, authenticationPages } from "@alien6/hankoshell-keycloak-theme-builder/react";

<ThemePreview config={draft} page="login-config-totp.ftl" locale="fr" />
```

The preview uses the shared renderer inside a Shadow DOM, keeping host styles isolated. For Next.js, load it from a client component with `next/dynamic` and `ssr: false`. Credential previews use sample profile fields and local password visibility controls; WebAuthn previews show the layout without loading authenticator scripts. Validate real authentication against your realm as well.

## Build and deliver on demand

```ts
import { buildTheme } from "@alien6/hankoshell-keycloak-theme-builder/builder";

const artifact = await buildTheme(config, {
  outputDir: "/output",
  signal: AbortSignal.timeout(20 * 60_000),
});
// artifact: { theme, path, sha256, bytes }
```

The compiler calls Vite and Keycloakify, then publishes the JAR atomically. Run it on the server or in an isolated build Job with Node, Java and Maven. `hanko-theme build-env` accepts the operator's `THEME_SLUG`, `THEME_*_COLOR`, `THEME_FONT_FAMILY`, `THEME_LOGO_URL`, `THEME_HEADLINE`, `THEME_SUBLINE` and `THEME_JAR_NAME` variables and writes to `/output`.

Compile code changes once in the platform's build environment. Use `prepareThemeArtifact` from `/artifact` to create a Docker build context containing the JAR, a versioned manifest and a small installer. Pass a reviewed, digest-pinned Alpine-compatible base image. Build, scan, sign and publish that image through your existing release pipeline.

With Hankoshell, Hub distributes the desired artifact reference and the operator verifies and installs it. The precompiled image needs no Node, Java, Maven or network access at runtime. This package needs no Kubernetes or Keycloak administrator credentials. `build-env` remains available for explicit standalone build Jobs.

## Live appearance

Set `runtime.endpoint` to a same-origin public appearance endpoint, for example `/appearance/{realm}/{clientId}.json`. Optional `refreshMs` enables polling. Responses may change appearance only; they cannot change the theme identity, endpoint or scripts. Invalid responses retain the last valid appearance.

A trusted build-time `--runtime-adapter ./loader.ts` can export a `ThemeLoader` to adapt an existing API. Draft storage, permissions, review and publication belong to the host application.

Color, logo and text changes should publish a profile instead of triggering a new native build. `/experience` exports `parseAppearance` and `applyAppearance` for the `hanko.appearance/v1` contract. Profiles cannot change installed identity, scripts or runtime endpoints. The embedded appearance remains usable when the profile service is unavailable.

## Extensible application screens

`/experience/react` exports `ExperienceShell` and `ProfilePage`. Supply compiled React modules and a `hanko.experience/v1` manifest declaring their IDs, surface types and required capabilities. The host supplies authenticated context and its own API adapters; backend authorization remains authoritative. Hanko is one possible adapter. New organization, resource, permission, agent or delegation screens need no operator-specific fields.
Set `embedded` when mounting the shell inside an application layout. Modules can read published presentation settings through `useTheme` from the same entry point.

`ThemeConfig.modules` carries bounded presentation data for these modules. It cannot load remote JavaScript or grant backend permissions. Account/administration modules run in the authenticated application, separate from Keycloak login templates, and use the same branding.

`ProfilePage` loads editable fields from a `ProfileController`, respects read-only metadata and saves only editable values. The controller binds the current user and delegates validation to its identity backend. For native Keycloak self-service, initiate the host OIDC client's normal authorization flow with `kc_action=UPDATE_PROFILE`; the shared `login-update-profile.ftl` page preserves native profile, federation and verification policies. Never use administrator credentials in a browser. The development gallery includes a local profile editor with sample data.

## Keycloak integration

Copy the generated JAR into Keycloak's `providers` directory, build/restart Keycloak as required by your deployment, then select the theme for a realm or client. The JAR targets Keycloak 26 through Keycloakify. Keycloak still controls MFA policies, required actions, sessions and redirect validation; installing a theme does not enable these features. Logout confirmation and front-channel logout use Keycloak's native flow; applications must also clear their own session through their OIDC client/ADK.

Authenticated organization/resource administration belongs in reusable application screens backed by your application's API. It shares this branding, while authorization and credentials remain server-side.

## Develop

```sh
npm run check
npx playwright install chromium
npm run test:browser
# With Docker available, against the generated JAR:
npm run test:keycloak
```

The checks cover untrusted configuration, runtime fetching and the page gallery. To report a vulnerability privately, use GitHub's **Security → Report a vulnerability**. Contributions use pull requests; run the checks above and describe the changed authentication flow.

## Distribution

The package targets the official npm registry. Its release workflow supports [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) with OIDC and provenance: configure the npm package's trusted publisher for this repository and `release.yml`, then enable the repository variable `NPM_PUBLISH_ENABLED=true`. First publication and package ownership must be established with npm before enabling it. No npm token is stored in this repository.

After the first public release, the [Keycloak extensions catalog](https://www.keycloak.org/extensions) is a possible community listing. A listing does not imply endorsement or inclusion in Keycloak itself.

Built with [Keycloakify](https://docs.keycloakify.dev/). See the [Keycloak theme guide](https://www.keycloak.org/ui-customization/themes) for server configuration. Apache-2.0 licensed.
