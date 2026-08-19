"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { NotebookProvider } from "../../chat/runtime/provider";
import { useRefreshStaleNotebookSources } from "../../sources/hooks/use-refresh-stale-sources";
import { ProductionNotebookPresentation } from "./notebook-presentation";
import { ProductionWorkspaceLayout } from "./production-workspace-layout";

interface ProductionNotebookWorkspaceProps {
  greeting: string;
  initialMessage?: string;
  notebookId?: string;
  orgSlug: string;
  t: NotebookTranslations;
}

export function ProductionNotebookWorkspace({
  greeting,
  initialMessage,
  notebookId,
  orgSlug,
  t,
}: ProductionNotebookWorkspaceProps) {
  useRefreshStaleNotebookSources(notebookId);

  return (
    <ProductionNotebookPresentation>
      <NotebookProvider
        key={notebookId ?? "new"}
        orgSlug={orgSlug}
        notebookId={notebookId}
        initialMessage={initialMessage}
      >
        <ProductionWorkspaceLayout
          greeting={greeting}
          orgSlug={orgSlug}
          t={t}
        />
      </NotebookProvider>
    </ProductionNotebookPresentation>
  );
}
