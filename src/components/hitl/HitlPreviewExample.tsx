import {
  ChevronDown,
  ChevronUp,
  Code,
  Gear,
  RightSidebarChevronClose,
  RightSidebarChevronOpen,
} from "@box/blueprint-web-assets/icons/Medium";
import BoxAnnotations from "box-annotations";
import ContentPreview from "box-ui-elements/es/elements/content-preview";
import type { FocusEvent, MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IntlProvider } from "react-intl";

const apiHost = "https://api.box.com";
const appHost = "https://app.box.com";
const defaultFileId = "2056558550295";
const previewLibraryVersion = "3.59.0";
const initialHitlFeatures = {
  "metadata.aiSuggestions.enabled": true,
  "metadata.betaLanguage.enabled": true,
  "metadata.boundingBox.enabled": true,
  "metadata.confidenceScore.enabled": true,
  "metadata.redesign.enabled": true,
};
type HitlFeatureKey = keyof typeof initialHitlFeatures;

const featureOptions: Array<{ key: HitlFeatureKey; label: string }> = [
  { key: "metadata.aiSuggestions.enabled", label: "AI suggestions" },
  { key: "metadata.boundingBox.enabled", label: "Bounding boxes" },
  { key: "metadata.confidenceScore.enabled", label: "Confidence scores" },
  { key: "metadata.betaLanguage.enabled", label: "Beta language" },
  { key: "metadata.redesign.enabled", label: "Metadata redesign" },
];
const boxAnnotations = new BoxAnnotations({});

interface PreviewTokenResponse {
  accessToken?: string;
  error?: string;
  expiresIn?: number;
  fileId?: string;
  tokenType?: string;
}

interface BoxAiReference {
  boundingBox?: { bottom: number; left: number; right: number; top: number };
  page?: number;
}

interface BoxAiConfidenceScore {
  level?: string;
  score: number;
}

interface ConfidenceDisplay {
  level: string;
  percentage: number;
}

interface PreviewBoundingBox {
  height: number;
  id: string;
  pageNumber: number;
  width: number;
  x: number;
  y: number;
}

interface PreviewEventEntry {
  id: number;
  message: string;
  time: string;
}

interface ContentPreviewInstance {
  getPreview: () => {
    showBoundingBoxHighlights?: (boxes: PreviewBoundingBox[]) => void;
  } | null;
}

interface BoxUiResponse {
  config?: { url?: string };
  data?: {
    confidence_score?: Record<string, BoxAiConfidenceScore[] | BoxAiConfidenceScore>;
    entries?: Array<Record<string, unknown>>;
    reference?: Record<string, BoxAiReference[] | BoxAiReference>;
  };
}

interface BoxUiRequest {
  data?: unknown;
  method?: string;
  url?: string;
}

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));
const normalizeFieldName = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
const getBoundingBoxStorageKey = (fileId: string) => `hitl-bounding-boxes:${fileId}`;
const getConfidenceStorageKey = (fileId: string) => `hitl-confidence-scores:${fileId}`;

function getStoredConfidenceScores(fileId: string): Record<string, ConfidenceDisplay> {
  try {
    return JSON.parse(sessionStorage.getItem(getConfidenceStorageKey(fileId)) || "{}");
  } catch {
    return {};
  }
}

function getStoredBoundingBoxes(fileId: string): Record<string, PreviewBoundingBox[]> {
  try {
    return JSON.parse(sessionStorage.getItem(getBoundingBoxStorageKey(fileId)) || "{}");
  } catch {
    return {};
  }
}

function toPreviewBoundingBoxes(references: Record<string, BoxAiReference[] | BoxAiReference>) {
  return Object.fromEntries(Object.entries(references).map(([fieldKey, fieldReferences]) => {
    const entries = Array.isArray(fieldReferences) ? fieldReferences.flat() : [fieldReferences];
    const boxes = entries.flatMap((reference, index) => {
      if (!reference.boundingBox) return [];
      const { bottom, left, right, top } = reference.boundingBox;

      return [{
        height: clampPercentage((bottom - top) * 100 + 0.5),
        id: `bbox-${fieldKey}-${index + 1}`,
        pageNumber: (reference.page || 0) + 1,
        width: clampPercentage((right - left) * 100 + 0.5),
        x: clampPercentage(left * 100 - 0.25),
        y: clampPercentage(top * 100 - 0.25),
      }];
    });

    return [normalizeFieldName(fieldKey), boxes];
  }));
}

function getLowestConfidence(score: BoxAiConfidenceScore[] | BoxAiConfidenceScore) {
  const scores = Array.isArray(score) ? score.flat() : [score];
  return scores.reduce((lowest, current) => current.score < lowest.score ? current : lowest);
}

function toConfidenceDisplays(scores: Record<string, BoxAiConfidenceScore[] | BoxAiConfidenceScore>) {
  return Object.fromEntries(Object.entries(scores).map(([fieldKey, fieldScores]) => {
    const lowest = getLowestConfidence(fieldScores);
    const percentage = lowest.score <= 1 ? lowest.score * 100 : lowest.score;
    return [normalizeFieldName(fieldKey), {
      level: (lowest.level || "unknown").toLowerCase(),
      percentage: Math.round(clampPercentage(percentage)),
    }];
  }));
}

function getPersistedConfidenceDisplays(entries: Array<Record<string, unknown>> = []) {
  const displays: Record<string, ConfidenceDisplay> = {};

  entries.forEach((entry) => {
    Object.entries(entry).forEach(([fieldKey, fieldValue]) => {
      if (!fieldValue || typeof fieldValue !== "object" || !("details" in fieldValue)) return;
      const details = fieldValue.details;
      if (!details || typeof details !== "object" || !("confidenceScore" in details)) return;

      const score = details.confidenceScore;
      if (typeof score !== "number") return;
      const level = "confidenceLevel" in details && typeof details.confidenceLevel === "string"
        ? details.confidenceLevel
        : "unknown";
      const percentage = score <= 1 ? score * 100 : score;

      displays[normalizeFieldName(fieldKey)] = {
        level: level.toLowerCase(),
        percentage: Math.round(clampPercentage(percentage)),
      };
    });
  });

  return displays;
}

export function HitlPreviewExample() {
  const [fileId, setFileId] = useState(defaultFileId);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [features, setFeatures] = useState(initialHitlFeatures);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [previewEvents, setPreviewEvents] = useState<PreviewEventEntry[]>([]);
  const [boundingBoxesByField, setBoundingBoxesByField] = useState(() => getStoredBoundingBoxes(defaultFileId));
  const [confidenceScoresByField, setConfidenceScoresByField] = useState(() => getStoredConfidenceScores(defaultFileId));
  const contentPreviewRef = useRef<ContentPreviewInstance | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const confidenceScoresByFieldRef = useRef<Record<string, BoxAiConfidenceScore[] | BoxAiConfidenceScore>>({});
  const referencesByFieldRef = useRef<Record<string, BoxAiReference[] | BoxAiReference>>({});
  const eventIdRef = useRef(0);
  const isConfidenceEnabled = features["metadata.confidenceScore.enabled"];
  const getToken = useCallback(async () => token, [token]);
  const logEvent = useCallback((message: string) => {
    const event: PreviewEventEntry = {
      id: ++eventIdRef.current,
      message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setPreviewEvents((events) => [...events.slice(-99), event]);
  }, []);

  const fetchPreviewToken = useCallback(async (nextFileId: string) => {
    setIsTokenLoading(true);
    setToken("");
    setTokenError("");
    logEvent("Requesting downscoped token from local CCG route");

    try {
      const response = await fetch(`/api/box-preview-token?fileId=${encodeURIComponent(nextFileId)}`);
      const payload = await response.json() as PreviewTokenResponse;

      if (!response.ok || !payload.accessToken) {
        throw new Error(payload.error || "Token route did not return an access token");
      }

      setToken(payload.accessToken);
      logEvent(`Token ready for file ${payload.fileId || nextFileId}`);
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : "Unable to fetch Box preview token");
      logEvent("Token request failed");
    } finally {
      setIsTokenLoading(false);
    }
  }, [logEvent]);

  useEffect(() => {
    setBoundingBoxesByField(getStoredBoundingBoxes(fileId));
    setConfidenceScoresByField(getStoredConfidenceScores(fileId));
    void fetchPreviewToken(fileId);
  }, [fetchPreviewToken, fileId]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return undefined;

    let animationFrame = 0;
    const renderConfidenceScores = () => {
      container.querySelectorAll<HTMLElement>("h5").forEach((heading) => {
        const label = heading.textContent?.trim() || "";
        const confidence = confidenceScoresByField[normalizeFieldName(label)];

        if (!isConfidenceEnabled || !confidence) {
          heading.removeAttribute("data-hitl-confidence");
          heading.removeAttribute("data-hitl-confidence-level");
          heading.removeAttribute("aria-label");
          return;
        }

        heading.dataset.hitlConfidence = `${confidence.percentage}%`;
        heading.dataset.hitlConfidenceLevel = confidence.level;
        heading.setAttribute("aria-label", `${label}, ${confidence.percentage}% confidence`);
      });
    };
    const scheduleRender = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(renderConfidenceScores);
    };
    const observer = new MutationObserver(scheduleRender);

    renderConfidenceScores();
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [confidenceScoresByField, isConfidenceEnabled]);

  const handleBoxUiResponse = useCallback((response: BoxUiResponse) => {
    if (response.config?.url?.includes("/metadata?view=detailed") && response.data?.entries) {
      const confidenceDisplays = getPersistedConfidenceDisplays(response.data.entries);
      if (Object.keys(confidenceDisplays).length) {
        sessionStorage.setItem(getConfidenceStorageKey(fileId), JSON.stringify(confidenceDisplays));
        setConfidenceScoresByField(confidenceDisplays);
      }
    }
    if (response.config?.url?.includes("/ai/extract_structured") && response.data?.reference) {
      const boxesByField = toPreviewBoundingBoxes(response.data.reference);
      sessionStorage.setItem(getBoundingBoxStorageKey(fileId), JSON.stringify(boxesByField));
      setBoundingBoxesByField(boxesByField);
      referencesByFieldRef.current = response.data.reference;
    }
    if (response.config?.url?.includes("/ai/extract_structured") && response.data?.confidence_score) {
      const confidenceDisplays = toConfidenceDisplays(response.data.confidence_score);
      sessionStorage.setItem(getConfidenceStorageKey(fileId), JSON.stringify(confidenceDisplays));
      setConfidenceScoresByField(confidenceDisplays);
      confidenceScoresByFieldRef.current = response.data.confidence_score;
    }
    return response;
  }, [fileId]);

  const handleBoxUiRequest = useCallback((request: BoxUiRequest) => {
    if (request.method?.toLowerCase() !== "put" || !request.url?.includes("/metadata/")) {
      return request;
    }

    const operations = Array.isArray(request.data) ? [...request.data] : [];
    Object.entries(referencesByFieldRef.current).forEach(([fieldKey, references]) => {
      const path = `/${fieldKey.replace(/~/g, "~0").replace(/\//g, "~1")}`;
      if (!operations.some((operation) => operation?.path === `${path}/targetLocation`)) {
        operations.push(
          { op: "add", path: `${path}/process`, value: "AI_EXTRACTED" },
          { op: "add", path: `${path}/targetLocation`, value: JSON.stringify(references) },
        );
      }
    });
    Object.entries(confidenceScoresByFieldRef.current).forEach(([fieldKey, scores]) => {
      const path = `/${fieldKey.replace(/~/g, "~0").replace(/\//g, "~1")}`;
      const confidence = getLowestConfidence(scores);
      if (!operations.some((operation) => operation?.path === `${path}/confidenceScore`)) {
        operations.push(
          { op: "add", path: `${path}/confidenceScore`, value: confidence.score },
          { op: "add", path: `${path}/confidenceLevel`, value: confidence.level },
        );
      }
    });

    return { ...request, data: operations };
  }, []);

  const handleMetadataInteraction = useCallback((event: FocusEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLElement)) return;

    const field = event.target.closest<HTMLElement>("[data-testid$='-field'], [data-metadata-field]");
    const readOnlyField = event.target.closest("h5, p")?.parentElement;
    const fieldLabel = field?.dataset.testid === "metadata-field"
      ? field.querySelector("h5")?.textContent?.trim()
      : field?.dataset.testid?.replace(/-field$/, "") || readOnlyField?.querySelector("h5")?.textContent?.trim();
    const boxes = fieldLabel ? boundingBoxesByField[normalizeFieldName(fieldLabel)] : undefined;
    const preview = contentPreviewRef.current?.getPreview();

    if (boxes?.length && preview?.showBoundingBoxHighlights) {
      requestAnimationFrame(() => preview.showBoundingBoxHighlights?.(boxes));
    }
  }, [boundingBoxesByField]);

  return (
    <div className="main-page hitl-page">
      <div className={isSettingsOpen ? "hitl-workspace" : "hitl-workspace hitl-workspace--settings-closed"}>
        <div className="hitl-stage">
          {!isSettingsOpen ? (
            <div className="hitl-settings-toolbar">
              <button
                type="button"
                className="hitl-settings-open"
                aria-controls="hitl-settings"
                aria-expanded="false"
                aria-label="Open preview configuration"
                title="Open preview configuration"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Gear aria-hidden="true" />
                <RightSidebarChevronOpen aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <section className="hitl-preview-shell" aria-label="Box Content Preview">
          {token ? (
            <div
              ref={previewContainerRef}
              className="hitl-content-preview"
              onClick={handleMetadataInteraction}
              onFocus={handleMetadataInteraction}
            >
              <IntlProvider locale="en">
                <ContentPreview
                  key={`${fileId}-${token}-${Object.values(features).join("-")}`}
                  apiHost={apiHost}
                  appHost={appHost}
                  boxAnnotations={boxAnnotations}
                  componentRef={(component: ContentPreviewInstance | null) => {
                    contentPreviewRef.current = component;
                  }}
                  contentAnswersProps={{
                    isCitationsEnabled: true,
                    isMarkdownEnabled: true,
                    isResetChatEnabled: true,
                    show: true,
                    suggestedQuestions: [
                      {
                        id: "summarize-document",
                        label: "Summarize",
                        prompt: "Summarize this document",
                      },
                      {
                        id: "key-takeaways",
                        label: "Key takeaways",
                        prompt: "What are the key takeaways from this document?",
                      },
                    ],
                  }}
                  contentSidebarProps={{
                    defaultView: "metadata",
                    detailsSidebarProps: { hasProperties: true },
                    features,
                    hasActivityFeed: true,
                    hasDetails: true,
                    hasMetadata: true,
                    hasSkills: false,
                    metadataSidebarProps: {
                      onError: (error: unknown) => {
                        logEvent(`Metadata error: ${error instanceof Error ? error.message : "unable to update metadata"}`);
                      },
                      onSuccess: () => {
                        logEvent("Metadata saved with HITL references");
                      },
                    },
                    onError: (error: unknown) => {
                      logEvent(`Sidebar error: ${error instanceof Error ? error.message : "unable to load sidebar data"}`);
                    },
                  }}
                  enableBoundingBoxHighlights={features["metadata.boundingBox.enabled"]}
                  enableModernizedComponents
                  enableThumbnailsSidebar
                  features={features}
                  fileId={fileId}
                  hasHeader
                  initialEntries={["/metadata"]}
                  onError={(error: unknown) => {
                    logEvent(`Preview error: ${error instanceof Error ? error.message : "unable to load preview"}`);
                  }}
                  onLoad={(data: { error?: string }) => {
                    if (data?.error) {
                      logEvent(`Preview error: ${data.error}`);
                      return;
                    }

                    logEvent("Content Preview loaded with HITL metadata features");
                  }}
                  previewLibraryVersion={previewLibraryVersion}
                  requestInterceptor={handleBoxUiRequest}
                  responseInterceptor={handleBoxUiResponse}
                  showAnnotations
                  token={getToken}
                />
              </IntlProvider>
            </div>
          ) : tokenError ? (
            <div className="hitl-preview-empty" role="status">{tokenError}</div>
          ) : isTokenLoading ? (
            <div className="hitl-preview-empty" role="status">Requesting Box preview token</div>
          ) : (
            <div className="hitl-preview-empty" role="status">Waiting for Box preview token</div>
          )}
          </section>
        </div>

        {isSettingsOpen ? (
          <aside id="hitl-settings" className="hitl-settings" aria-label="Preview configuration">
            <div className="hitl-settings__header">
              <div>
                <span className="hitl-settings__eyebrow">HITL</span>
                <h2>Configuration</h2>
              </div>
              <button
                type="button"
                className="hitl-icon-button"
                aria-label="Close preview configuration"
                title="Close preview configuration"
                onClick={() => setIsSettingsOpen(false)}
              >
                <RightSidebarChevronClose aria-hidden="true" />
              </button>
            </div>

            <div className="hitl-settings__section">
              <label htmlFor="hitl-file-id">File ID</label>
              <input
                id="hitl-file-id"
                value={fileId}
                onChange={(event) => setFileId(event.target.value.trim())}
              />
            </div>

            <div className="hitl-settings__section">
              <span className="hitl-settings__label">Authentication</span>
              <div className="hitl-token-source">
                <span className={token ? "hitl-status-dot hitl-status-dot--ready" : "hitl-status-dot"} aria-hidden="true" />
                {isTokenLoading ? "Requesting CCG token" : token ? "Downscoped token ready" : "Token unavailable"}
              </div>
              {tokenError ? <p className="hitl-error">{tokenError}</p> : null}
            </div>

            <div className="hitl-settings__section">
              <span className="hitl-settings__label">Features</span>
              <div className="hitl-feature-list">
                {featureOptions.map(({ key, label }) => (
                  <label className="hitl-feature-toggle" key={key}>
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={features[key]}
                      onChange={(event) => {
                        const isEnabled = event.target.checked;
                        setFeatures((current) => ({ ...current, [key]: isEnabled }));
                        logEvent(`${label} ${isEnabled ? "enabled" : "disabled"}`);
                      }}
                    />
                    <span className="hitl-switch" aria-hidden="true" />
                  </label>
                ))}
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {isSettingsOpen ? (
        <section className={isTerminalOpen ? "hitl-terminal" : "hitl-terminal hitl-terminal--closed"} aria-label="Preview events">
        <button
          type="button"
          className="hitl-terminal__header"
          aria-controls="hitl-event-log"
          aria-expanded={isTerminalOpen}
          onClick={() => setIsTerminalOpen((isOpen) => !isOpen)}
        >
          <span className="hitl-terminal__title"><Code aria-hidden="true" /> Preview events</span>
          <span className="hitl-terminal__meta">
            {previewEvents.length} {previewEvents.length === 1 ? "event" : "events"}
            {isTerminalOpen ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
          </span>
        </button>
        {isTerminalOpen ? (
          <div id="hitl-event-log" className="hitl-terminal__body" role="log" aria-live="polite">
            {previewEvents.length ? previewEvents.map((event) => (
              <div className="hitl-terminal__line" key={event.id}>
                <time>{event.time}</time>
                <span aria-hidden="true">$</span>
                <span>{event.message}</span>
              </div>
            )) : (
              <div className="hitl-terminal__line hitl-terminal__line--muted">
                <span aria-hidden="true">$</span>
                <span>Waiting for preview events</span>
              </div>
            )}
          </div>
        ) : null}
        </section>
      ) : null}
    </div>
  );
}
