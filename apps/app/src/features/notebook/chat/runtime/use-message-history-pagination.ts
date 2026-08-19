"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  notebookMessageRowsToMessages,
  oldestNotebookMessageToCursor,
} from "@/features/notebook/chat/notebook-messages";
import { api } from "@/shared/api/trpc/client";

import { useLatestRef } from "./use-latest-ref";

interface UseMessageHistoryPaginationParams {
  orgSlug: string;
  notebookId: string | undefined;
  messages: NotebookMessage[];
  setMessages: React.Dispatch<React.SetStateAction<NotebookMessage[]>>;
  hasOlderMessages: boolean;
}

function prependUniqueMessages(
  current: NotebookMessage[],
  olderMessages: NotebookMessage[],
) {
  const existingIds = new Set(current.map((message) => message.id));
  const uniqueOlder = olderMessages.filter(
    (message) => !existingIds.has(message.id),
  );
  return [...uniqueOlder, ...current];
}

export function useMessageHistoryPagination({
  orgSlug,
  notebookId,
  messages,
  setMessages,
  hasOlderMessages: initialHasOlderChats,
}: UseMessageHistoryPaginationParams) {
  const utils = api.useUtils();
  const messagesRef = useLatestRef(messages);
  const [prevNotebookId, setPrevNotebookId] = useState(notebookId);
  const [hasOlderMessages, setHasOlderChats] = useState(initialHasOlderChats);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const loadingRef = useRef(false);
  const activeNotebookIdRef = useRef(notebookId);

  if (notebookId !== prevNotebookId) {
    setPrevNotebookId(notebookId);
    setHasOlderChats(initialHasOlderChats);
  } else if (
    initialHasOlderChats !== hasOlderMessages &&
    initialHasOlderChats
  ) {
    setHasOlderChats(initialHasOlderChats);
  }

  useEffect(() => {
    activeNotebookIdRef.current = notebookId;
  }, [notebookId]);

  const loadOlderMessages = useCallback(async () => {
    if (!notebookId || !hasOlderMessages || loadingRef.current) return;

    const oldest = messagesRef.current[0];
    if (!oldest) return;

    const beforeCursor = oldestNotebookMessageToCursor(oldest);
    if (!beforeCursor) return;

    const fetchNotebookId = notebookId;
    loadingRef.current = true;
    setIsLoadingOlder(true);

    try {
      const page = await utils.notebook.listOlderMessages.fetch({
        orgSlug,
        notebookId: fetchNotebookId,
        beforeCursor,
      });

      const olderMessages = await notebookMessageRowsToMessages(page.items);

      if (fetchNotebookId !== activeNotebookIdRef.current) return;

      setMessages((current) => prependUniqueMessages(current, olderMessages));

      setHasOlderChats(Boolean(page.nextOlderCursor));
    } catch {
      if (fetchNotebookId === activeNotebookIdRef.current) {
        setHasOlderChats(false);
      }
    } finally {
      loadingRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [
    hasOlderMessages,
    messagesRef,
    notebookId,
    orgSlug,
    setMessages,
    utils.notebook.listOlderMessages,
  ]);

  return { hasOlderMessages, isLoadingOlder, loadOlderMessages };
}
