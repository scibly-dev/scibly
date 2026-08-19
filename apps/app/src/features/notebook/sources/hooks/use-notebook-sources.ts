"use client";

import { api } from "@/shared/api/trpc/client";
import { isSourceIngesting } from "@/shared/content/sources/constants";

const INGESTION_POLL_MS = 5_000;

export function sourcesIngestionPollInterval(
  sources: readonly { status: string }[] | undefined,
): number | false {
  return sources?.some((source) => isSourceIngesting(source.status))
    ? INGESTION_POLL_MS
    : false;
}

// Polls while ingestion is in flight: the write that finishes it isn't always
// a reply this client is waiting on (a concurrent claim, a batch handoff past
// REFRESH_BATCH_LIMIT, or a dropped connection can all resolve it without this
// request hearing back), so the list re-asks instead of waiting on the reply.
export function useNotebookSources(
  notebookId: string | undefined,
  options?: { enabled?: boolean },
) {
  return api.notebook.source.list.useQuery(
    { notebookId: notebookId! },
    {
      enabled: Boolean(notebookId) && (options?.enabled ?? true),
      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
      refetchInterval: (query) =>
        sourcesIngestionPollInterval(query.state.data),
    },
  );
}
