import type { RefObject } from "react";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { DefaultChatTransport } from "ai";

import { isContinuationRequest } from "@/features/notebook/chat/continuation";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";

type NotebookTransportRefs = {
  orgSlugRef: RefObject<string>;
  activeNotebookIdRef: RefObject<string | undefined>;
  currentModelIdRef: RefObject<string>;
};

type NotebookTransportCallbacks = {
  setActiveNotebookId: (id: string | undefined) => void;
  onNotebookCreated: (params: { orgSlug: string; notebookId: string }) => void;
};

export function createNotebookTransport(
  refs: NotebookTransportRefs,
  callbacks: NotebookTransportCallbacks,
) {
  return new DefaultChatTransport<NotebookMessage>({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages, body }) => {
      const isContinuation = isContinuationRequest(messages);

      const { course, activeLesson, activeScene } =
        useCourseBuilderStore.getState();

      return {
        body: {
          ...(body ?? {}),
          ...(isContinuation
            ? { messages }
            : { message: messages[messages.length - 1] }),
          notebookId: refs.activeNotebookIdRef.current,
          orgSlug: refs.orgSlugRef.current,
          modelId: refs.currentModelIdRef.current,
          courseContext: course
            ? {
                course: { id: course.id, title: course.title },
                lesson: activeLesson
                  ? { id: activeLesson.id, title: activeLesson.title }
                  : undefined,
                scene: activeScene
                  ? { id: activeScene.id, title: activeScene.title }
                  : undefined,
              }
            : undefined,
        },
      };
    },
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      const id = response.headers.get("x-notebook-id");
      if (id) {
        const orgSlug = refs.orgSlugRef.current;
        callbacks.setActiveNotebookId(id);
        callbacks.onNotebookCreated({ orgSlug, notebookId: id });
      }
      return response;
    },
  });
}
