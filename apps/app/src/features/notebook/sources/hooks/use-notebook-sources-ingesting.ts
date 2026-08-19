"use client";

import { isSourceIngesting } from "@/shared/content/sources/constants";

import { useSidebarState } from "../../workspace/hooks/use-sidebar-state";
import { useNotebookSources } from "./use-notebook-sources";

// Consumed by the outdated-scene banner and navigator to suppress that UI
// until re-sync/re-ingest completes.
export function useNotebookSourcesIngesting(notebookId: string | undefined) {
  const rightSidebarTab = useSidebarState((state) => state.rightSidebarTab);
  const { data: sources = [] } = useNotebookSources(notebookId, {
    enabled: rightSidebarTab === "sources",
  });

  return sources.some((s) => isSourceIngesting(s.status));
}
