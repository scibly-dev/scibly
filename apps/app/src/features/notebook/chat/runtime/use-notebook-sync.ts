"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { RouterOutputs } from "@/shared/api/trpc/client";

import { routes } from "@scibly/routes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { notebookMessageRowsToMessages } from "@/features/notebook/chat/notebook-messages";
import { cleanTitleText } from "@/lib/utils";
import { sortNotebookMessageTimeline } from "@/shared/ai/chat/message-order";
import { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { syncNotebookUrl } from "../../course-builder/hooks/url-sync";
import { useInitCourseBuilderSelection } from "../../course-builder/hooks/use-init-course-builder-selection";

interface UseNotebookSyncParams {
  orgSlug: string;
  notebookIdProp: string | undefined;
  activeNotebookId: string | undefined;
  activeNotebookIdRef: React.RefObject<string | undefined>;
  setActiveNotebookId: (id: string | undefined) => void;
  setMessages: (messages: NotebookMessage[]) => void;
}

function useSyncedNotebook(orgSlug: string, notebookId: string | undefined) {
  const router = useRouter();
  const query = api.notebook.getById.useQuery(
    { orgSlug, notebookId: notebookId! },
    { enabled: Boolean(notebookId) },
  );
  useEffect(() => {
    if (query.isError && query.error)
      router.replace(routes.app.profile.org(orgSlug).notebook.root);
  }, [orgSlug, query.error, query.isError, router]);
  const notebookCourse = query.data?.course;
  useEffect(() => {
    if (!notebookCourse) return;
    const { course, openCourse } = useCourseBuilderStore.getState();
    if (notebookCourse.id !== course?.id)
      openCourse({
        course: { id: notebookCourse.id, title: notebookCourse.title },
        origin: "system",
      });
  }, [notebookCourse]);
  useInitCourseBuilderSelection({ linkedCourse: notebookCourse ?? null });
  return query.data;
}

function useHistoryHydration(
  params: Pick<
    UseNotebookSyncParams,
    "activeNotebookId" | "notebookIdProp" | "setMessages"
  > & { notebook: RouterOutputs["notebook"]["getById"] | undefined },
) {
  const loadedNotebookIdRef = useRef<string | null>(null);
  const previousIdRef = useRef(params.activeNotebookId);
  const [hydrated, setHydrated] = useState(!params.activeNotebookId);
  useEffect(() => {
    if (previousIdRef.current === params.activeNotebookId) return;
    previousIdRef.current = params.activeNotebookId;
    loadedNotebookIdRef.current = null;
    setHydrated(!params.activeNotebookId);
  }, [params.activeNotebookId]);
  useEffect(() => {
    const { notebook } = params;
    if (
      !notebook ||
      notebook.id !== params.activeNotebookId ||
      loadedNotebookIdRef.current === notebook.id
    )
      return;
    const skip =
      loadedNotebookIdRef.current === null &&
      (!params.notebookIdProp || params.notebookIdProp === "new");
    loadedNotebookIdRef.current = notebook.id;
    if (skip) {
      setHydrated(true);
      return;
    }
    void notebookMessageRowsToMessages(
      sortNotebookMessageTimeline(notebook.messages),
    ).then((messages) => {
      if (loadedNotebookIdRef.current !== notebook.id) return;
      params.setMessages(messages);
      setHydrated(true);
    });
  }, [params]);
  const reset = useCallback(() => {
    loadedNotebookIdRef.current = null;
  }, []);
  return { hydrated, reset };
}

function useNotebookTitleUpdate(
  orgSlug: string,
  activeNotebookId: string | undefined,
) {
  const utils = api.useUtils();
  const mutation = api.notebook.update.useMutation({
    onMutate: async (variables) => {
      const key = {
        orgSlug: variables.orgSlug,
        notebookId: variables.notebookId,
      };
      await utils.notebook.getById.cancel(key);
      const previous = utils.notebook.getById.getData(key);
      if (previous)
        utils.notebook.getById.setData(key, {
          ...previous,
          title: variables.title,
        });
      return { prev: previous };
    },
    onError: (error, variables, context) => {
      console.error("Failed to update notebook title", error);
      if (context?.prev)
        utils.notebook.getById.setData(
          { orgSlug: variables.orgSlug, notebookId: variables.notebookId },
          context.prev,
        );
    },
    onSettled: (data, error, variables) => {
      if (error || !data) return;
      void utils.notebook.getById.invalidate({
        orgSlug: variables.orgSlug,
        notebookId: data.id,
      });
      void utils.notebook.list.invalidate({ orgSlug: variables.orgSlug });
    },
  });
  return useCallback(
    (title: string) => {
      if (activeNotebookId)
        mutation.mutate({
          orgSlug,
          notebookId: activeNotebookId,
          title: cleanTitleText(title),
        });
    },
    [activeNotebookId, mutation, orgSlug],
  );
}

function useEnsureNotebook(
  params: Pick<
    UseNotebookSyncParams,
    "orgSlug" | "activeNotebookIdRef" | "setActiveNotebookId"
  >,
) {
  const mutation = api.notebook.ensure.useMutation();
  const pendingRef = useRef<Promise<string> | null>(null);
  const ensure = useCallback((): Promise<string> => {
    if (params.activeNotebookIdRef.current)
      return Promise.resolve(params.activeNotebookIdRef.current);
    if (pendingRef.current) return pendingRef.current;
    const promise = mutation
      .mutateAsync({ orgSlug: params.orgSlug })
      .then((created) => {
        params.setActiveNotebookId(created.id);
        syncNotebookUrl(params.orgSlug, created.id);
        return created.id;
      })
      .finally(() => {
        pendingRef.current = null;
      });
    pendingRef.current = promise;
    return promise;
  }, [mutation, params]);
  const reset = useCallback(() => {
    pendingRef.current = null;
  }, []);
  return { ensure, reset };
}

export function useNotebookSync({
  orgSlug,
  notebookIdProp,
  activeNotebookId,
  activeNotebookIdRef,
  setActiveNotebookId,
  setMessages,
}: UseNotebookSyncParams) {
  const notebook = useSyncedNotebook(orgSlug, activeNotebookId);
  const history = useHistoryHydration({
    activeNotebookId,
    notebookIdProp,
    setMessages,
    notebook,
  });

  const updateTitle = useNotebookTitleUpdate(orgSlug, activeNotebookId);
  const ensuring = useEnsureNotebook({
    orgSlug,
    activeNotebookIdRef,
    setActiveNotebookId,
  });
  const resetHistory = history.reset;
  const resetEnsuring = ensuring.reset;

  const resetNotebookSync = useCallback(() => {
    resetHistory();
    resetEnsuring();
  }, [resetEnsuring, resetHistory]);

  return {
    notebook,
    hasOlderMessages: notebook?.hasOlderMessages ?? false,
    isNotebookHistoryLoading: Boolean(activeNotebookId) && !history.hydrated,
    updateTitle,
    ensureNotebook: ensuring.ensure,
    resetNotebookSync,
  };
}
