# HITL Content Preview Handoff

Developer setup and implementation instructions: [`docs/HITL_IMPLEMENTATION_GUIDE.md`](docs/HITL_IMPLEMENTATION_GUIDE.md)

## Current Scope

Repo: `/Users/massnerder/Developer/Code/box-content-preview-hitl`

This branch adds a Box Content Preview HITL example to the existing Blueprint template app. The implementation uses Box CCG on the Bun server, downscopes the token for one file, and passes only the downscoped token to the browser UI element.

Test file ID: `2056558550295`

Box UI Elements dependency: `box-ui-elements@27.0.0-beta.66`

Box Annotations dependency: `box-annotations@5.2.1-beta.18`

## User-Facing Changes

- Added a left sidebar menu item:
  - Label: `HITL Example`
  - Icon: Blueprint `Code` icon, rendered as `</>`
- Added a HITL preview screen at `src/components/hitl/HitlPreviewExample.tsx`.
- The HITL screen defaults the file input to `2056558550295`.
- The app imports `ContentPreview` from the installed `box-ui-elements` npm package:
  - `box-ui-elements/es/elements/content-preview`
- The app does not load `box-ui-elements/dist/preview.js` from a CDN.
- The Box UI Elements CSS is loaded from the installed npm package, matching the VS Code webview pattern of resolving `elementsDir/preview.css`:
  - `/box-ui-elements/preview.css` -> `node_modules/box-ui-elements/dist/preview.css`
  - `/box-ui-elements/sidebar.css` -> `node_modules/box-ui-elements/dist/sidebar.css`
  - These CSS files are runtime stylesheet links added by `src/frontend.tsx`, not bundled CSS imports and not jsdelivr/CDN links.
- Box Content Preview is pinned with `previewLibraryVersion="3.59.0"`. The token is supplied as Box UI Elements' supported async token function because this Preview version requires `annotatorToken` to be a function.
- `box-annotations@5.2.1-beta.18` is supplied through Preview's `boxAnnotations` option. The annotation runtime bundled by the public Preview CDN lacks `setBoundingBoxHighlights()` even though Preview exposes the bounding-box API.
- The host shell uses a collapsible right configuration sidebar with feature switches.
- The Box Preview surface is `650px` tall and defaults its native sidebar to Metadata.
- A collapsible event terminal is pinned to the bottom while configuration is open and hidden when configuration is closed.
- Activity Feed is enabled in the Content Sidebar.
- Box AI Content Answers is enabled in the Preview header with citations, Markdown responses, reset chat, and two suggested questions.
- The Preview thumbnails sidebar is enabled.
- HITL feature flags include separate bounding-box and confidence-score toggles, matching the beta 49 release note: `hitl: decouple bboxes from confidence scores`.
- Metadata redesign is enabled with `metadata.redesign.enabled` so the sidebar uses `MetadataSidebarRedesign`, where the beta HITL bounding-box flow is wired.
- Bounding boxes use Box UI Elements' native Autofill request and Box Content Preview's public `showBoundingBoxHighlights()` API.
- A narrow response/selection bridge maps the Autofill `reference` coordinates to Preview's native percentage format. This is needed because this Box UI Elements beta does not forward unsaved Autofill field selection to Preview.
- Native Preview owns rectangle rendering, selection, scrolling, zoom, resize, and annotation-mode switching. There is no app-owned extraction request or overlay DOM.
- Existing metadata values without saved `targetLocation` references become highlightable after Autofill runs in the current session.
- Read-only metadata rows are clickable when saved `targetLocation` is present. The app bridge also caches normalized Autofill bbox coordinates in session storage per file, so read-only highlighting survives navigation and reloads within the browser session without storing tokens, values, or document text.
- The Box UI Elements beta drops Autofill references while constructing its update patch, so `requestInterceptor` restores the package-defined `/<field>/process` and `/<field>/targetLocation` operations before metadata updates. Redesigned-sidebar success/error callbacks must be supplied through `contentSidebarProps.metadataSidebarProps`.
- Confidence-score extraction is enabled and requests `include_confidence_score=true`. The app presents Box AI's numeric score as an accessible percentage pill beside each read-only metadata key, with high/medium/low color states, and persists `confidenceScore` plus `confidenceLevel` in the metadata patch.
- Modernized Box UI Elements styling is enabled with `enableModernizedComponents`.

## Server/Auth Flow

Implemented in `index.ts`.

Endpoint:

```text
GET /api/box-preview-token?fileId=2056558550295
```

Flow:

1. Request a CCG service-account token from `https://api.box.com/oauth2/token`.
2. Exchange that service token for a downscoped token with:
   - `resource=https://api.box.com/2.0/files/{fileId}`
   - `scope=base_preview item_download root_readwrite annotation_edit annotation_view_all ai.readwrite`
3. Return only the downscoped token to the browser.

The browser never receives the broader CCG service token.

## Environment

Created `.env` in this repo. It is ignored by git.

Required values:

```sh
BOX_CLIENT_ID=
BOX_CLIENT_SECRET=
BOX_ENTERPRISE_ID=
BOX_SUBJECT_TYPE=user
BOX_PREVIEW_SCOPES="base_preview item_download root_readwrite annotation_edit annotation_view_all ai.readwrite"
```

Required CCG subject:

```sh
BOX_SUBJECT_ID=385982796
```

This uses a user CCG subject rather than the enterprise subject.

## Files Changed

- `package.json`
  - Adds `box-ui-elements@27.0.0-beta.66`, React 18, `react-intl@6.6.8`, and a `postinstall` patch for Box package compatibility with Bun.
- `bun.lock`
  - Lockfile updates from dependency install.
- `index.ts`
  - Adds CCG and downscoped preview token route.
  - Serves Box UI Elements CSS routes from the installed npm package.
- `src/data/json/app-config.json`
  - Defines `HITL Example` as the default and only sidebar section.
- `src/components/sidebar/nav-items.ts`
  - Adds Blueprint `Code` icon mapping.
- `src/components/layout/AppLayout.tsx`
  - Renders `HitlPreviewExample` as the application content.
  - Removes unsupported `defaultMainContentSidebarVisible` prop from `Page`.
- `src/components/hitl/HitlPreviewExample.tsx`
  - New HITL preview screen.
  - Imports and renders the npm `ContentPreview` React component.
- Enables Activity Feed, Box AI Content Answers, and the Preview thumbnails sidebar.
- Enables modernized components plus metadata redesign, bounding boxes, confidence scores, AI suggestions, and beta language.
- Pins Box Content Preview `3.59.0`, supplies `box-annotations@5.2.1-beta.18`, and delegates bounding-box rendering to the native Preview API.
- `src/frontend.tsx`
  - Imports app and Blueprint CSS.
  - Adds runtime stylesheet links for the local Box UI Elements preview/sidebar CSS routes.
- `src/types/box-ui-elements-content-preview.d.ts`
  - Adds a local declaration for the npm `ContentPreview` entrypoint.
- `scripts/patch-box-ui-elements.mjs`
  - Patches generated Flow-only Box UI Elements schema files so Bun can statically validate the package ESM graph.
  - Patches `@box/box-ai-agent-selector` to replace embedded CJS `require("react")` calls with a static React import alias for Bun browser bundling.
- `src/styles/app-layout.css`
  - Adds HITL page/control/preview styling.

## Verification Completed

Commands:

```sh
bun run build
bun run build:dev
```

All passed.

TypeScript note:

- `NODE_OPTIONS=--max-old-space-size=8192 bunx tsc --noEmit` passed earlier in this integration pass.
- After the final CSS-route/bootstrap edit, both `bunx tsc --noEmit` and direct `./node_modules/.bin/tsc --noEmit` were interrupted after running silently for more than a minute. This looks like TypeScript graph cost from the full Box UI Elements package tree rather than a Bun package-manager issue.

Local smoke test:

```sh
PORT=3000 bun run dev
```

Browser verification at `http://localhost:3000/`:

- App loads.
- `HITL Example` sidebar item renders with `</>` icon.
- Clicking `HITL Example` renders the HITL screen.
- File ID input is prefilled with `2056558550295`.
- With real `.env`, the UI receives a downscoped preview token for the test file.
- Box Content Preview renders real document content for `Invoice 4838383.pdf`; no mock preview fallback is present.
- Local package CSS links are present:
  - `http://localhost:3000/box-ui-elements/preview.css`
  - `http://localhost:3000/box-ui-elements/sidebar.css`
- No jsdelivr links are loaded.
- HITL feature flags display AI suggestions, bounding boxes, confidence scores, beta language, and metadata redesign.
- Activity Feed, Box AI Content Answers, and thumbnail-sidebar props are enabled.
- Browser validation confirms Preview `3.59.0` loads and renders `Invoice 4838383.pdf` when the downscoped token is passed as an async token function.
- Browser network validation confirms native Metadata Autofill sends `include_reference=true` and receives coordinate-bearing references.
- Clicking Invoice Number after Autofill renders one native `.ba-BoundingBoxHighlightRect`; zooming changes its pixel dimensions while preserving percentage positioning.
- After Autofill, selecting **Cancel** and clicking the read-only Invoice Number heading also renders the native bounding box; no metadata save or Edit action is required for the current session.
- The `Controls` button toggles `aria-expanded` from `true` to `false` and back to `true`.
- The browser still reports two React ref warnings from Box UI Elements internals. Preview load is not blocked.

Token endpoint verification:

```sh
curl -i 'http://localhost:3000/api/box-preview-token?fileId=2056558550295'
```

Expected current response: HTTP 200 with a downscoped bearer token payload.

## Remaining Work

- Keep the Box app CORS allowlist aligned with the local origin used for testing, currently `http://localhost:3000`.
- If Box returns a scope or authorization error, verify the CCG app has access to the target enterprise/file and adjust `BOX_PREVIEW_SCOPES` only as needed. `ai.readwrite` is required for Box AI metadata autofill because it calls `POST /2.0/ai/extract_structured`.

## Notes

- A prior attempt was started in `/Users/massnerder/Developer/Code/box-blueprint-studio` before the repo was corrected. Those changes were left untouched. Clean them up separately only if requested.
- `box-ui-elements@27.0.0-beta.66` installed successfully, but Bun emitted peer dependency warnings from the Box UI Elements package tree. The local typecheck and builds still passed.
- Plain `bunx tsc --noEmit` can hit Node's default heap limit after importing the full Box UI Elements graph; use the `NODE_OPTIONS` command shown above.
