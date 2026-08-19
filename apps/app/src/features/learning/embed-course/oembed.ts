import { stripLocaleFromPathname } from "@scibly/i18n";
import {
  APP_ORIGIN,
  EMBED_ROUTE_PATHNAME,
  PUBLIC_COURSE_ROUTE_PATHNAME,
  routes,
} from "@scibly/routes";

import {
  buildEmbedSnippet,
  DEFAULT_EMBED_HEIGHT,
  DEFAULT_EMBED_WIDTH,
  EMBED_LANGUAGE_AUTO,
} from "./snippet";

const COURSE_PATHNAMES = [PUBLIC_COURSE_ROUTE_PATHNAME, EMBED_ROUTE_PATHNAME];

// Share link and embed URL both resolve, with or without a locale prefix:
// all four shapes get pasted and all four name the same course.
export function courseIdFromEmbeddableUrl(candidate: string): string | null {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.origin !== APP_ORIGIN) return null;

  const pathname = stripLocaleFromPathname(url.pathname).replace(/\/+$/, "");
  for (const prefix of COURSE_PATHNAMES) {
    if (!pathname.startsWith(`${prefix}/`)) continue;
    const courseId = pathname.slice(prefix.length + 1);

    if (courseId && !courseId.includes("/")) return courseId;
  }
  return null;
}

export function oEmbedDiscoveryUrl(courseId: string): string {
  const url = new URL(routes.app.api.oembed);
  url.searchParams.set("url", routes.app.public.course(courseId));
  url.searchParams.set("format", "json");
  return url.toString();
}

export function parseSizeParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export interface OEmbedCourse {
  id: string;
  title: string;
  organization: { name: string } | null;
}

export interface OEmbedResponse {
  version: "1.0";
  type: "rich";
  provider_name: string;
  provider_url: string;
  title: string;
  author_name?: string;
  width: number;
  height: number;
  html: string;
}

// The default height may only be reduced, never raised: a consumer asking for
// more would get a course floating in blank space. No `thumbnail_url`: the
// spec requires its pixel dimensions alongside it and a course's thumbnail is
// stored without them.
export function buildOEmbedResponse({
  course,
  maxWidth,
  maxHeight,
}: {
  course: OEmbedCourse;
  maxWidth: number | null;
  maxHeight: number | null;
}): OEmbedResponse {
  const height = Math.min(
    maxHeight ?? DEFAULT_EMBED_HEIGHT,
    DEFAULT_EMBED_HEIGHT,
  );
  const width = maxWidth ?? DEFAULT_EMBED_WIDTH;
  return {
    version: "1.0",
    type: "rich",
    provider_name: "scibly",
    provider_url: new URL(routes.web.base.home).origin,
    title: course.title,
    ...(course.organization && { author_name: course.organization.name }),
    width,
    height,
    html: buildEmbedSnippet({
      appOrigin: APP_ORIGIN,
      courseId: course.id,
      courseTitle: course.title,
      lang: EMBED_LANGUAGE_AUTO,
      heightPx: height,
      widthPx: width,

      includeScript: false,
    }),
  };
}
