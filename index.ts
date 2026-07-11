import index from "./index.html";

const boxTokenEndpoint = "https://api.box.com/oauth2/token";
const boxUiElementPreviewCss = Bun.file("node_modules/box-ui-elements/dist/preview.css");
const boxUiElementSidebarCss = Bun.file("node_modules/box-ui-elements/dist/sidebar.css");
const defaultBoxFileId = "2056558550295";
const defaultPreviewScopes = "base_preview item_download root_readwrite annotation_edit annotation_view_all ai.readwrite";
const port = Number(process.env.PORT) || 3000;

interface BoxTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...init?.headers,
    },
  });
}

function cssResponse(file: Bun.BunFile) {
  return new Response(file, {
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": "text/css; charset=utf-8",
    },
  });
}

async function requestBoxToken(body: URLSearchParams): Promise<BoxTokenResponse> {
  const response = await fetch(boxTokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const description = typeof payload.error_description === "string" ? payload.error_description : undefined;
    const error = typeof payload.error === "string" ? payload.error : "Box token request failed";
    throw new Error(description || error);
  }

  return payload as BoxTokenResponse;
}

async function createDownscopedPreviewToken(fileId: string): Promise<BoxTokenResponse> {
  const clientId = process.env.BOX_CLIENT_ID;
  const clientSecret = process.env.BOX_CLIENT_SECRET;
  const subjectType = process.env.BOX_SUBJECT_TYPE || "enterprise";
  const subjectId = process.env.BOX_SUBJECT_ID || process.env.BOX_ENTERPRISE_ID;

  if (!clientId || !clientSecret || !subjectId) {
    throw new Error("Missing BOX_CLIENT_ID, BOX_CLIENT_SECRET, and BOX_ENTERPRISE_ID or BOX_SUBJECT_ID");
  }

  const serviceToken = await requestBoxToken(new URLSearchParams({
    box_subject_id: subjectId,
    box_subject_type: subjectType,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  }));

  return requestBoxToken(new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    resource: `https://api.box.com/2.0/files/${fileId}`,
    scope: process.env.BOX_PREVIEW_SCOPES || defaultPreviewScopes,
    subject_token: serviceToken.access_token,
    subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
  }));
}

Bun.serve({
  port,
  routes: {
    "/": index,
    "/box-ui-elements/preview.css": () => cssResponse(boxUiElementPreviewCss),
    "/box-ui-elements/sidebar.css": () => cssResponse(boxUiElementSidebarCss),
    "/api/box-preview-token": async (request) => {
      const url = new URL(request.url);
      const fileId = url.searchParams.get("fileId") || defaultBoxFileId;

      try {
        const token = await createDownscopedPreviewToken(fileId);

        return jsonResponse({
          accessToken: token.access_token,
          expiresIn: token.expires_in,
          fileId,
          tokenType: token.token_type,
        });
      } catch (error) {
        return jsonResponse({
          error: error instanceof Error ? error.message : "Unable to create Box preview token",
        }, { status: 500 });
      }
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at http://localhost:${port}`);
