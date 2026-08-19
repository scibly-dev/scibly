"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

import { useNotebookState } from "../runtime/context";
import { useLatestRef } from "../runtime/use-latest-ref";

/**
 * Keeping the scroll position across the prepend is `MessageScroller.Viewport`'s
 * job (`preserveScrollOnPrepend`), so all that is left here is deciding *when*
 * to ask for more.
 */
export function useOlderMessagePagination(notebookId: string | undefined) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);
  const inFlightRef = useRef(false);

  const canLoadRef = useRef(true);
  const { hasOlderMessages, isLoadingOlderMessages, loadOlderMessages } =
    useNotebookState();
  const loadRef = useLatestRef(loadOlderMessages);
  const { ref: loadOlderRef, inView } = useInView({
    root: viewport,
    rootMargin: "120px",
  });

  useEffect(() => {
    userScrolledRef.current = false;
    inFlightRef.current = false;
    canLoadRef.current = true;
  }, [notebookId]);

  useEffect(() => {
    if (!inView) {
      canLoadRef.current = true;
      return;
    }
    if (
      !hasOlderMessages ||
      isLoadingOlderMessages ||
      inFlightRef.current ||
      !canLoadRef.current ||
      !userScrolledRef.current
    )
      return;
    canLoadRef.current = false;
    inFlightRef.current = true;
    void loadRef.current().finally(() => {
      inFlightRef.current = false;
    });
  }, [hasOlderMessages, inView, isLoadingOlderMessages, loadRef]);

  const markUserScrolled = useCallback(() => {
    userScrolledRef.current = true;
  }, []);

  return {
    setViewport,
    loadOlderRef,
    isLoadingOlderMessages,
    markUserScrolled,
  };
}
