import type { NotebookSource } from "@scibly/db/client";
import type { IntegrationPageRevision } from "@/features/integrations/contracts";

// `content` is excluded: the extractor is about to overwrite it, and the one
// extractor that needs the old value (TEXT) fetches the column itself.
export type ExtractableSource = Omit<NotebookSource, "content">;

export interface ExtractedContent {
  text: string;
  pageCount?: number;

  title?: string;

  lastEdited?: Date;
}

export interface SourceExtractor {
  isIntegration: boolean;
  extract(source: ExtractableSource): Promise<ExtractedContent>;

  getRevision?(
    source: ExtractableSource,
  ): Promise<IntegrationPageRevision | null>;
}
