# Hankoshell Keycloak Theme Builder

Build native Keycloak themes on demand from shared React pages and brand configuration. Use the Node API in a backend, the CLI in a worker, and the same components for dashboard previews.

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

This package is not yet published to npm. Tagged releases distribute a package tarball and an example JAR with GitHub build attestations.

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

`/experience/react` exports `ExperienceShell` and `ProfilePage`. Supply compiled React modules and a `hanko.experience/v1` manifest declaring their IDs, surface types and required capabilities. New organization, resource, permission, agent or delegation screens do not add fields to the operator API. The host supplies authenticated context and Hanko ADK/API adapters; backend authorization remains authoritative.

`ThemeConfig.modules` carries bounded presentation data for these modules. It cannot load remote JavaScript or grant backend permissions. Account/administration modules run in the authenticated application, separate from Keycloak login templates, and use the same branding.

`ProfilePage` loads editable fields from a `ProfileController`, respects read-only metadata and saves only editable values. The controller binds the current user and delegates validation to its identity backend. For native Keycloak self-service, initiate the host OIDC client's normal authorization flow with `kc_action=UPDATE_PROFILE`; the shared `login-update-profile.ftl` page preserves native profile, federation and verification policies. Never use administrator credentials in a browser. The development gallery includes a local profile editor with sample data.

## Keycloak integration

Copy the generated JAR into Keycloak's `providers` directory, build/restart Keycloak as required by your deployment, then select the theme for a realm or client. The JAR targets Keycloak 26 through Keycloakify. Keycloak still controls MFA policies, required actions, sessions and redirect validation; installing a theme does not enable these features. Logout confirmation and front-channel logout use Keycloak's native flow; applications must also clear their own session through their OIDC client/ADK.

Authenticated organization/resource administration belongs in reusable application screens backed by the Hanko API/ADK. It should share this branding, without putting administrative credentials into a login theme.

## Develop

```sh
npm run check
npx playwright install chromium
npm run test:browser
# With Docker available, against the generated JAR:
npm run test:keycloak
```

The checks cover untrusted configuration, runtime fetching and the page gallery. To report a vulnerability privately, use GitHub's **Security → Report a vulnerability**. Contributions use pull requests; run the checks above and describe the changed authentication flow.

Built with [Keycloakify](https://docs.keycloakify.dev/). See the [Keycloak theme guide](https://www.keycloak.org/ui-customization/themes) for server configuration. Apache-2.0 licensed.
