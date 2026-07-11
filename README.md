# Box Content Preview HITL Example

A working React example of Box Content Preview with a human-in-the-loop metadata workflow. It combines Box UI Elements, Box AI structured extraction, native Preview bounding boxes, and numeric confidence scores using a server-issued downscoped token.

## What This Demonstrates

- Client Credentials Grant (CCG) with a Box user subject.
- Server-side token exchange restricted to one file.
- `ContentPreview` loaded from the `box-ui-elements` npm package.
- Metadata selected as the default Content Sidebar view.
- Box AI Metadata Autofill with references and confidence scores.
- Native bounding-box rendering that remains aligned during zoom and scroll.
- Numeric confidence percentages beside metadata fields.
- Activity Feed, Box AI Content Answers, annotations, and thumbnails.
- A collapsible configuration sidebar and sticky Preview event terminal.

## Prerequisites

- Bun.
- A Box enterprise with an authorized CCG Custom App.
- A Box user that can access the target file and metadata template.
- The local frontend origin in the Box app CORS allowlist, such as `http://localhost:3000`.

The app currently uses these known-good versions:

```text
box-ui-elements  27.0.0-beta.66
box-annotations  5.2.1-beta.18
Content Preview  3.59.0
React            18.3.1
```

## Box App Configuration

Enable the application scopes required for files, metadata, Preview, annotations, and Box AI. Authorize the app in the Admin Console and use a user CCG subject with access to the test content.

The downscoped browser token uses:

```text
base_preview
item_download
root_readwrite
annotation_edit
annotation_view_all
ai.readwrite
```

`root_readwrite` permits metadata updates. `ai.readwrite` permits Box AI structured extraction.

## Local Setup

1. Install dependencies.

   ```sh
   bun install
   ```

2. Create `.env` in the repository root.

   ```sh
   BOX_CLIENT_ID=
   BOX_CLIENT_SECRET=
   BOX_ENTERPRISE_ID=
   BOX_SUBJECT_TYPE=user
   BOX_SUBJECT_ID=<box-user-id>
   BOX_PREVIEW_SCOPES="base_preview item_download root_readwrite annotation_edit annotation_view_all ai.readwrite"
   ```

3. Start the app.

   ```sh
   PORT=3000 bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The default example file is `2056558550295`. Enter another accessible Box file ID in the configuration sidebar to test a different file.

## Expected Workflow

1. The server obtains a CCG token for the configured user.
2. The server exchanges it for a token downscoped to the selected file.
3. The browser receives only the downscoped token and loads Content Preview.
4. Metadata opens by default.
5. Run Autofill to extract values, references, and confidence scores.
6. Select a metadata field to highlight its source value in Preview.
7. Save metadata to persist the Box AI process, target location, and confidence details.

## Verification

```sh
bun run build:dev
bun run build
```

To smoke-test the token endpoint:

```sh
curl -i 'http://localhost:3000/api/box-preview-token?fileId=2056558550295'
```

Expected result: HTTP 200 with a downscoped token payload. Never expose the client secret or broad CCG service token to the browser.

## Documentation

- [Developer implementation guide](docs/HITL_IMPLEMENTATION_GUIDE.md): numbered, source-linked instructions for reproducing the integration.
- [Current handoff](HITL_HANDOFF.md): implementation state, verification history, and remaining operational checks.

The implementation guide distinguishes Box configuration, native Box behavior, required host code, and temporary beta workarounds with consistent emojis.
