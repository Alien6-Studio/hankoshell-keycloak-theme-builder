# HankoShell Theme Builder and Studio

[Open Hanko Studio](https://studio.hanko.sh/) to explore 16 complete Keycloak design directions, edit their pages and export your project. The public site and editor share HankoShell typography and red accents, with light, dark and system appearance. The online demo and the self-hosted editor work with any Keycloak project; no HankoShell platform or services subscription is required. The [React Studio module](studio/README.md) can also be embedded in your application or the Hanko Dashboard.

Build native Keycloak themes from React and brand configuration. Preview them locally, compile a JAR through the CLI or Node API, and publish appearance changes without rebuilding. Use it independently or embed it in your platform; no Hanko services or credentials are required.

[![CI](https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

## Theme Studio in pictures

Start from a complete theme, an individual page or a reusable section.

![Theme Studio gallery with complete identity theme compositions](studio/docs/screenshots/gallery.png)

Edit text, images and styles live, with guided drag-and-drop blocks and image uploads. The live theme preview below is shown in English.

![Haven theme live preview shown in English](studio/docs/screenshots/editor.png)

## Try it

Requires Node.js 22.12+. Building a JAR also requires Java 21 and Maven. From a checkout:

```sh
npm ci
npm run build
node dist/cli.js init theme.json
node dist/cli.js dev theme.json
node dist/cli.js build theme.json --out dist_keycloak
```

The local gallery offers login, registration, OTP setup with QR code, OTP verification/reset, authenticator selection, recovery codes, WebAuthn, password recovery, email verification and logout. It includes English/French previews and light/dark modes. Authentication forms cannot submit in the gallery; passkey previews do not invoke an authenticator.

Authentication previews also offer Spanish, German, Italian, Brazilian Portuguese,
Arabic and Hebrew. Arabic and Hebrew previews set the appropriate language and
right-to-left direction. Hebrew adds core login translations through Keycloakify's
extra-language API; remaining native messages fall back to English. The legacy
self-service gallery retains its English/French copy. Enable internationalization
and the intended locales in the target Keycloak realm before native qualification.

Install the CLI and native API from npm:

```sh
npm install @alien6-studio/hankoshell-keycloak-theme-builder
```

The [latest release](https://github.com/Alien6-Studio/hankoshell-keycloak-theme-builder/releases/latest) also provides independently installable package archives, the standalone Studio website, an example JAR, SHA-256 checksums and GitHub build attestations. Verify downloaded assets with `gh attestation verify <file> --repo Alien6-Studio/hankoshell-keycloak-theme-builder`.

## Public website

[studio.hanko.sh](https://studio.hanko.sh/) presents the real catalogue with a filterable collection and an indexable page for each theme. **Open Studio** opens the static editor at `/app/`. The browser demo supports editing, browser-local saves, project JSON and React/Next exports. It has no compilation service or Keycloak connection; build native JARs locally with the CLI below.

To develop the public site from a checkout:

```sh
npm ci
npm ci --prefix studio
npm run website:build
python3 -m http.server 7440 --bind 127.0.0.1 --directory website/dist
```

`npm run website:test` checks the collection, theme pages, mobile navigation, accessibility and the real editor. The Public Studio workflow builds, checks and deploys `website/dist/` to GitHub Pages using the custom domain. The public HTML includes canonical URLs, social previews, structured data and a sitemap; editor state is excluded from search indexing.

Previews are captured from the same catalogue renderer used by Studio. After changing the pinned catalogue, regenerate them with `npm run website:capture` (requires Playwright Chromium and `cwebp`). The build verifies their catalogue fingerprint and checksums. Site and Studio chrome share `studio/src/dashboard-tokens.css`; individual theme colours remain independent.

## Compile a Studio project

The compiler consumes exported `hanko.theme-studio.project/v1` documents with the installed, declarative renderer:

```sh
node dist/cli.js dev-project identity.studio.json --port 5173
node dist/cli.js build-project identity.studio.json --name identity --out dist_keycloak
```

Login, registration and OTP compositions reproduce their guided blocks, embedded images, appearance and translated form labels. Other authentication steps retain the native renderer within the shared login layout. Input names, form actions, validation, MFA enrollment and action tokens remain managed by Keycloak. Preview input examples never prefill credentials. Custom executable renderers and plugin declarations are rejected in project mode.

Email verification, password reset and required-action emails compile to native HTML and plain-text FreeMarker templates. Authored text remains message data, with HTML escaping; `{{prénom}}` and `{{organisation}}` are supported in email bodies. Subjects support literal translated text. Other email kinds inherit Keycloak's parent theme. Remote HTTPS assets still require network access when displayed; embedded images are preferable.

Install the JAR under Keycloak's `providers/`, build/restart the Keycloak image as required by your installation, then choose its login and/or email theme in the realm. A client's login override is independent of the realm email theme. The standalone editor exports a project and installation instructions. A compatible Hanko host adds persisted versions, isolated compilation, installation observations, assignment and guarded rollback.

For Node applications, import `buildStudioProject` from `@alien6-studio/hankoshell-keycloak-theme-builder/project`. The result includes the JAR SHA-256, project SHA-256 and native theme types. The CLI also accepts gzip snapshots and `--project-sha256` to verify the exact uncompressed input bytes before building. Inputs are limited to 40 MiB; Hanko cluster builds additionally bound the compressed payload to 900,000 base64 characters.

Account, administration and welcome pages export as React/Next source with their authored blocks, images, styles, native labels and translations. React is the only required runtime package. The application supplies authenticated forms and operations through `renderNative`; no Hanko SDK installation is required. See the [integration example](studio/README.md#application-screen-export).

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

## Dashboard preview

```tsx
import { ThemePreview, authenticationPages } from "@alien6-studio/hankoshell-keycloak-theme-builder/react";

<ThemePreview config={draft} page="login-config-totp.ftl" locale="fr" />
```

The preview uses the shared renderer inside a Shadow DOM, keeping host styles isolated. For Next.js, load it from a client component with `next/dynamic` and `ssr: false`. Credential previews use sample profile fields and local password visibility controls; WebAuthn previews show the layout without loading authenticator scripts. Validate real authentication against your realm as well.

## Build and deliver on demand

```ts
import { buildTheme } from "@alien6-studio/hankoshell-keycloak-theme-builder/builder";

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

The Studio navigation can be inspected in [studio/sitemap.xml](studio/sitemap.xml). The [catalogue source snapshot](vendor/theme-catalog-source.json) contains 16 complete themes with independent names and designs, including four vivid photographic directions. Each theme provides 18 editable screens and eight content languages.

## Catalogue ownership

[hankoshell-theme-catalog](https://github.com/Alien6-Studio/hankoshell-theme-catalog) owns all theme documents, original assets, font sources, content translations and authored layout recipes. This builder owns the editor, generic rendering, contracts and Keycloak/React export engines. It consumes one reviewed catalogue archive at build time, pinned by SHA-256 in `vendor/theme-catalog-source.json` and both npm lockfiles. There is no editable `studio/catalog` copy and no required sibling checkout. The release manifest records the catalogue revision and archive hash alongside the builder revision.

To update the catalogue, build an archive in its own repository and pass it explicitly:

```sh
npm run catalog:update -- /path/to/alien6-hankoshell-theme-catalog-0.1.0.tgz
npm run build
npm run build:site --prefix studio
```

The generated Studio and CLI packages include the reviewed catalogue content and layouts. Consumers do not install a local sibling package or fetch themes at runtime.
