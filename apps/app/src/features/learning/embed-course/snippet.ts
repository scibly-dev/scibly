import { appendLocalePrefix, getLocale } from "@scibly/i18n";
import { EMBED_ROUTE_PATHNAME } from "@scibly/routes";

import { EMBED_FRAME_ATTRIBUTE, EMBED_SCRIPT_PATH } from "./protocol";
import { CALIBRATED_LAYER_HEIGHT } from "./viewport";

export const EMBED_HEIGHT_OPTIONS = [
  480,
  CALIBRATED_LAYER_HEIGHT,
  720,
  900,
] as const;

export const DEFAULT_EMBED_HEIGHT = CALIBRATED_LAYER_HEIGHT;

export const DEFAULT_EMBED_WIDTH = 640;

/** Serves the course in whichever of our languages the visitor's browser asks
 * for, as the share link already does. */
export const EMBED_LANGUAGE_AUTO = "auto";

export interface EmbedSnippetInput {
  appOrigin: string;
  courseId: string;

  lang: string;

  courseTitle: string;
  heightPx: number;

  widthPx?: number;

  includeScript: boolean;
}

// Escapes both quote characters, not just the one the markup below uses: this
// snippet is also the oEmbed `html` a consumer injects with their own quoting.
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function embedCourseUrl(
  appOrigin: string,
  lang: string,
  courseId: string,
): string {
  const path = `${EMBED_ROUTE_PATHNAME}/${courseId}`;

  const locale = getLocale(lang, false);
  return `${appOrigin}${locale ? appendLocalePrefix(locale, path) : path}`;
}

// No `sandbox` attribute: it would cut the course off from the storage and
// scripting it needs.
export function buildEmbedSnippet({
  appOrigin,
  courseId,
  lang,
  courseTitle,
  heightPx,
  widthPx = DEFAULT_EMBED_WIDTH,
  includeScript,
}: EmbedSnippetInput): string {
  const iframe = [
    "<iframe",
    `  src="${escapeAttribute(embedCourseUrl(appOrigin, lang, courseId))}"`,
    `  title="${escapeAttribute(courseTitle)}"`,
    `  ${EMBED_FRAME_ATTRIBUTE}`,

    `  width="${widthPx}"`,
    `  height="${heightPx}"`,
    `  style="width: 100%; height: ${heightPx}px; border: 0;"`,

    `  allow="autoplay"`,

    `  referrerpolicy="strict-origin-when-cross-origin"`,
    `  loading="lazy"`,
    "></iframe>",
  ].join("\n");

  if (!includeScript) return iframe;

  return `${iframe}\n<script src="${escapeAttribute(
    `${appOrigin}${EMBED_SCRIPT_PATH}`,
  )}" async></script>`;
}
