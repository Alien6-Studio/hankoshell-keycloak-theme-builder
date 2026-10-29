# Hanko Theme Studio

Visual editor shared by the standalone builder and the Hanko Dashboard. React module, shadcn/Radix controls, scoped styles, guided blocks, media uploads, editable translations and interactive account/administration previews.

The gallery includes **Essentiel, Éditorial and Minuit**: 18 screens each, eight content languages including Arabic and Hebrew RTL, original licensed illustrations, plus four reusable sections. Apply a whole theme or one page while choosing whether to retain your brand and existing content. Save personal templates in the host library; standalone projects and templates use IndexedDB in the current browser. Export JSON for backup and sharing. The editing interface is currently French. Projects show their unsaved state, and a document close/reload prompts when changes remain. Browser history and deep links for editor states are not connected yet.

## Run and verify

Requires Node 22. From this directory:

```sh
npm ci
npm run build
npm test
npx tsc --noEmit
npm run dev
```

Open <http://127.0.0.1:7425/>. Browser qualification uses `node test/browser.mjs` while the dev server is running; Playwright is provided by the parent builder development installation.

## Publishable standalone build

```sh
npm run build:site
python3 -m http.server 7426 --bind 127.0.0.1 --directory site
```

Open <http://127.0.0.1:7426/>. The `site/` directory is static and supports subdirectory hosting. Schema validators are generated at build time and loaded on demand; no development API or runtime JavaScript compilation is needed. Embedding hosts may still provide `contractsBase` for their own authenticated validation endpoint. Server-side validation and authorization remain mandatory for host persistence.

`npm run package:preview` prepares a website ZIP, npm archive, manifest and SHA-256 sums in `artifacts/release/`. The package uses the npm `preview` channel. Its manifest reports any uncommitted source changes; these files are not a published release.

See the [qualification report](docs/qualification-0.1.0-preview.3.md), [Styles/gallery update](docs/qualification-0.1.0-preview.4.md), [navigation cleanup](docs/qualification-0.1.0-preview.5.md) and [publication plan and roadmap](docs/publication-and-roadmap.md).

## Navigation map

**Modèles** in the main toolbar opens the gallery of complete themes, pages, reusable sections and saved models. The editor sidebar contains **Blocs**, **Styles**, **Médias** and **Calques**. **Styles** adjusts the current screen's colors, font, layout, spacing and corners; color palettes preserve its content, translations and media. The inspector's **Style** tab adjusts the selected element. Applying a model belongs exclusively to the gallery.

Choose a theme type, then navigate using its section tabs and child pages. The editor has no parallel screen dropdown or repeated breadcrumb above the canvas. The **Plan** button exposes the Studio workspaces and the theme screen hierarchy. `sitemap.xml` is an application navigation map with parent/child states and demo transitions, not a search-engine indexing file. `npm run sitemap` generates both the XML and `public/sitemap.html` from `src/navigation.ts`; the same definitions drive the menus. Security contains password, authenticator and sessions; administration contains users/user detail, clients/client configuration and permissions. Navigation preserves the project destination and undo history.

## Embed

```tsx
'use client';
import {ThemeStudio} from '@alien6/hankoshell-theme-studio';
import '@alien6/hankoshell-theme-studio/styles.css';

<ThemeStudio
  embedded
  initialView="gallery"
  context={{kind:'organization', id:organization.id, label:organization.name, realm:organization.realm}}
  initialProject={loadedProject}
  contractsBase="/api/theme-studio/contracts"
  onSave={saveProject}
  templates={templateMetadata}
  onLoadTemplate={loadTemplate}
  onSaveTemplate={saveTemplate}
/>
```

Load this browser component without SSR in Next.js. The host owns authentication, scope enforcement and persistence; no credentials belong in project JSON. Contract endpoints expose GET `/{kind}` and POST `/validate` with `{kind,document}`. The `./contracts` export is server-only and validates the bundled schemas with Ajv. Plugin declarations do not install executable renderers. Unknown renderer types must be rejected by the host.

## Dashboard distribution

`node scripts/sync-dashboard.mjs [path-to-hanko-platform]` builds and packs the module into the Dashboard's versioned `vendor/` directory and writes its source digest. Run the printed installation command, then Dashboard checks. This keeps clean CI installs independent of a neighboring checkout or unpublished npm package. Rebuild and synchronize whenever Studio source, contracts or catalogue changes.

## Catalogue source

`catalog/` is a vendored snapshot of the sibling `hankoshell-theme-catalog` repository. `scripts/generate-catalog.mjs` generates the three complete packs and original SVG/PNG assets; `scripts/preview-catalog.mjs` captures their rendered previews using the running dev server. Generation is a maintainer task, not a runtime dependency. Validate changes with `npm test` and review their previews before synchronizing the Dashboard distribution.

## Export boundaries

Project JSON contains the full composition. React/Next exports provide a starter using the Hanko SDK account components, the brand and basic appearance; custom blocks and form text are not reproduced yet. The SDK must also be distributed before public consumers can install that export; administration interactions in the preview use demo data. The native builder can consume the appearance configuration. Compilation of arbitrary Studio blocks and email compositions into a JAR, deployment and assignment are **not connected** to the publication screen yet. Saving a project records a draft and never implies deployment. Angular remains a future adapter. Authenticator previews use transient demo secrets that are excluded from project and template exports.
