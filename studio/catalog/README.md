# HankoShell Theme Catalogue

Reusable themes for Hanko Theme Studio, licensed under Apache-2.0.

Twenty-three complete themes provide 18 editable screens each: login, registration, OTP, three email templates, profile, security, password, authenticator setup, sessions, administration journeys and welcome. Four reusable sections provide guided starting blocks. Two older style presets (Warm and Compact) retain three starter screens each.

Essential, Editorial and Midnight include original SVG sources, PNG assets with SHA-256 and licence metadata, rendered previews, native appearance configurations and declarative page documents. Twenty additional named compositions share their screen documents and assets while defining distinct form structures, typography, spacing and navigation. Applying a variant creates a fully editable project without a dependency on the catalogue. Templates use independent names and original assets. Content languages: French, English, Spanish, German, Italian, Brazilian Portuguese, Arabic and Hebrew. Arabic and Hebrew use RTL. Custom content requires reviewed translations; missing translations fall back to the page source language.

![Editorial login preview](themes/editorial/preview.png)

## Use and validate

The Studio consumes a reviewed local snapshot of `catalog/`, without runtime remote code or network dependency. `themes.json` describes styles, pages, output capabilities and reusable sections. `contracts/` contains the matching JSON Schemas and validator.

```sh
npm ci
npm test
```

Requires Node 22. Every complete theme has 18 guided screens. Targets are declared per page: full project JSON; appearance configuration for native login themes; React/Next application screens. Administration previews are application compositions, not a replacement Keycloak admin console. The builder compiles login and email compositions into a Keycloak JAR. Catalogue data never establishes deployment state.

## Contribute

Add assets with their editable source and licence, and include their SHA-256 in the manifest. Add JSON page documents without scripts, credentials or remote images. Declare actual renderer/export capabilities. Include all screens and translations before declaring `complete: true`. Validate the full catalogue and inspect desktop, narrow layouts and RTL previews before proposing a change. Version catalogue updates and let hosts pin a reviewed snapshot.

Plugin declarations are contracts, not executable extensions. MCP tooling can propose declarative changes after host validation; this repository starts no MCP server.
