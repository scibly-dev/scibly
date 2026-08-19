import type { SourceExtractor } from "./types";

import { SOURCE_TYPES } from "@/shared/content/sources/constants";

import { pdfExtractor, textExtractor } from "./file-extractors";
import { notionPageExtractor } from "./integration-extractors";

export type {
  ExtractableSource,
  ExtractedContent,
  SourceExtractor,
} from "./types";

const sourceExtractors = new Map<string, SourceExtractor>([
  [SOURCE_TYPES.PDF, pdfExtractor],
  [SOURCE_TYPES.TEXT, textExtractor],
  [SOURCE_TYPES.NOTION_PAGE, notionPageExtractor],
]);

export function getSourceExtractor(sourceType: string): SourceExtractor {
  const extractor = sourceExtractors.get(sourceType);
  if (!extractor) {
    throw new Error(
      `[SourceExtractorRegistry] No extractor registered for source type "${sourceType}". ` +
        `Known types: ${[...sourceExtractors.keys()].join(", ")}`,
    );
  }
  return extractor;
}
