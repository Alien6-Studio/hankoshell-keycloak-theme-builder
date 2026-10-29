# HankoShell Theme Catalogue

Reusable themes for Hanko Theme Studio, licensed under Apache-2.0.

Three complete packs — **Essentiel**, **Éditorial**, **Minuit** — contain 54 editable screens: login, registration, OTP, three email templates, profile, security, password, authenticator setup, sessions, administration journeys and welcome. Four reusable sections provide guided starting blocks. Two older style presets (Warm and Compact) retain three starter screens each.

Each complete pack includes original SVG sources, PNG assets with SHA-256 and licence metadata, a rendered preview, a native appearance configuration and declarative page documents. Content languages: French, English, Spanish, German, Italian, Brazilian Portuguese, Arabic and Hebrew. Arabic and Hebrew use RTL. Custom content requires reviewed translations; missing translations fall back to the page source language.

![Éditorial login preview](catalog/themes/editorial/preview.png)

## Use and validate

The Studio consumes a reviewed local snapshot of `catalog/`, without runtime remote code or network dependency. `themes.json` describes styles, pages, output capabilities and reusable sections. `contracts/` contains the matching JSON Schemas and validator.

```sh
npm ci
npm test
```

Requires Node 22. Every complete theme has 18 guided screens. Targets are declared per page: full project JSON; appearance configuration for native login themes; React/Next SDK account components. Administration previews are application compositions, not a replacement Keycloak admin console. Composed blocks and emails still require a Studio build adapter before JAR publication. Catalogue data never establishes deployment state.

## Contribute

Add assets with their editable source and licence, and include their SHA-256 in the manifest. Add JSON page documents without scripts, credentials or remote images. Declare actual renderer/export capabilities. Include all screens and translations before declaring `complete: true`. Validate the full catalogue and inspect desktop, narrow layouts and RTL previews before proposing a change. Version catalogue updates and let hosts pin a reviewed snapshot.

The maintainer generator and preview capture tools live in `hankoshell-keycloak-theme-builder/studio/scripts/`; consumers only need this repository's data. Plugin declarations are contracts, not executable extensions. MCP tooling can propose declarative changes after host validation; this repository starts no MCP server.
