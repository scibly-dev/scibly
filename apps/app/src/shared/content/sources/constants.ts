export const MAX_WORDS_PER_SOURCE = 50_000;

export const MAX_CHARS_PER_SOURCE = MAX_WORDS_PER_SOURCE * 10;

export const MAX_CHARS_PER_WORD = 1_000;

export const MAX_CHARS_PER_WEB_FETCH = 16_000;

export const MAX_HTML_BYTES_PER_WEB_FETCH = 2 * 1024 * 1024;

export const WEB_FETCH_MAX_REDIRECTS = 5;

export const WEB_FETCH_MAX_RETRIES = 2;

export const WEB_FETCH_RETRY_DELAY_MS = 750;

export const SOURCE_TYPES = {
  PDF: "PDF",
  TEXT: "TEXT",

  NOTION_PAGE: "NOTION_PAGE",
} as const;

export type SourceType = (typeof SOURCE_TYPES)[keyof typeof SOURCE_TYPES];

export const SOURCE_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  READY: "READY",
  FAILED: "FAILED",
} as const;

export type SourceStatus = (typeof SOURCE_STATUS)[keyof typeof SOURCE_STATUS];

export const INGESTING_STATUSES = [
  SOURCE_STATUS.PENDING,
  SOURCE_STATUS.PROCESSING,
] as const satisfies readonly SourceStatus[];

export function isSourceIngesting(status: string): boolean {
  return INGESTING_STATUSES.some((ingesting) => ingesting === status);
}

export const MAX_FILE_SIZE = {
  PDF: 20 * 1024 * 1024,
  TEXT: 5 * 1024 * 1024,

  NOTION_PAGE: 0,
} as const satisfies Record<SourceType, number>;

export const SOURCE_UPLOAD_GRANT_TTL_MS = 10 * 60 * 1000;

export const UPLOAD_SOURCE_TYPES = [
  SOURCE_TYPES.PDF,
  SOURCE_TYPES.TEXT,
] as const satisfies readonly SourceType[];

export type UploadSourceType = (typeof UPLOAD_SOURCE_TYPES)[number];

export const EXTENSION_TO_SOURCE_TYPE = new Map<string, UploadSourceType>([
  [".pdf", SOURCE_TYPES.PDF],
  [".txt", SOURCE_TYPES.TEXT],
  [".md", SOURCE_TYPES.TEXT],
]);

export const ACCEPTED_EXTENSIONS = [...EXTENSION_TO_SOURCE_TYPE.keys()];
