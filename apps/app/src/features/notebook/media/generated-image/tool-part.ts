import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookToolPartOf } from "@/features/notebook/chat/tools/tool-parts";

import {
  getToolParts,
  isToolPartDone,
} from "@/features/notebook/chat/tools/tool-parts";

type GenerateImagePart = NotebookToolPartOf<"generateImage">;

export interface ImageGenerationInvocation {
  toolCallId?: string;
  prompt?: string;
  alt?: string;
  output?: Extract<GenerateImagePart, { state: "output-available" }>["output"];
  isDone: boolean;
  isPending: boolean;
  isError: boolean;
  errorText?: string;
}

export function getImageGenerationInvocationForPart(
  part: NotebookMessage["parts"][number],
): ImageGenerationInvocation | null {
  if (part.type !== "tool-generateImage") return null;

  const isError = part.state === "output-error";

  return {
    toolCallId: part.toolCallId,
    prompt: part.input?.prompt,
    alt: part.input?.alt,
    output: part.state === "output-available" ? part.output : undefined,
    isDone: isToolPartDone(part) && !isError,
    isPending: !isToolPartDone(part),
    isError,
    errorText: isError ? part.errorText : undefined,
  };
}

function getMessageImageGenerationInvocations(
  message?: NotebookMessage,
): ImageGenerationInvocation[] {
  return getToolParts(message)
    .map(getImageGenerationInvocationForPart)
    .filter(
      (invocation): invocation is ImageGenerationInvocation =>
        invocation !== null,
    );
}

export function getPendingImageGenerationInvocation(
  messages: NotebookMessage[],
): ImageGenerationInvocation | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    const pending = getMessageImageGenerationInvocations(message).find(
      (invocation) => invocation.isPending,
    );
    if (pending) return pending;
  }

  return null;
}

export function getImageGenerationInvocations(
  messages: NotebookMessage[],
): ImageGenerationInvocation[] {
  const invocations: ImageGenerationInvocation[] = [];

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    invocations.push(...getMessageImageGenerationInvocations(message));
  }

  return invocations;
}
