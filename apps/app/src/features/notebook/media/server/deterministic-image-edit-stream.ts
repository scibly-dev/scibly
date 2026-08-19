import type { UIMessageStreamWriter } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { GenerateImageInput } from "@/features/notebook/media/tools/image-schemas";

import {
  normalizeAppError,
  reportAppError,
} from "@scibly/api/application-error/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { buildImageNotebookTools } from "@/features/notebook/server";
import {
  type GenerationSettlement,
  reportAndSettleStreamError,
} from "@/shared/ai/server/generation-settlement";

type PersistMessages = (params: {
  notebookId: string;
  messages: NotebookMessage[];
}) => Promise<void>;

async function executeImageEdit(params: {
  writer: UIMessageStreamWriter<NotebookMessage>;
  notebookId: string;
  orgSlug: string;
  userId: string;
  imageEdit: GenerateImageInput;
  correlationId: string;
  settlement: GenerationSettlement;
}) {
  const toolCallId = crypto.randomUUID();
  params.writer.write({ type: "start" });
  params.writer.write({ type: "start-step" });
  params.writer.write({
    type: "tool-input-available",
    toolCallId,
    toolName: "generateImage",
    input: params.imageEdit,
    providerExecuted: true,
  });
  try {
    const execute = buildImageNotebookTools({
      notebookId: params.notebookId,
      orgSlug: params.orgSlug,
      session: { user: { id: params.userId } },
    }).generateImage.execute;
    if (!execute)
      throw new Error("generateImage is missing its server executor.");

    const output = await execute(params.imageEdit, {
      toolCallId,
      messages: [],
      context: {},
    });
    params.settlement.markProduced();
    params.writer.write({
      type: "tool-output-available",
      toolCallId,
      output,
      providerExecuted: true,
    });
  } catch (error) {
    const normalized = normalizeAppError(error, {
      correlationId: params.correlationId,
    });
    reportAppError(normalized, {
      endpoint: "chat.image-edit",
      actorId: params.userId,
    });

    params.settlement.keepsCharge();
    params.writer.write({
      type: "tool-output-error",
      toolCallId,
      errorText: normalized.message,
      providerExecuted: true,
    });
  }
  params.writer.write({ type: "finish-step" });
  params.writer.write({ type: "finish" });
}

export function createDeterministicImageEditStreamResponse({
  notebookId,
  orgSlug,
  userId,
  fullMessages,
  imageEdit,
  persistMessages,
  correlationId,
  settlement,
}: {
  notebookId: string;
  orgSlug: string;
  userId: string;
  fullMessages: NotebookMessage[];
  imageEdit: GenerateImageInput;
  persistMessages: PersistMessages;
  correlationId: string;

  settlement: GenerationSettlement;
}) {
  const stream = createUIMessageStream<NotebookMessage>({
    originalMessages: fullMessages,
    generateId: () => crypto.randomUUID(),
    execute: ({ writer }) =>
      executeImageEdit({
        writer,
        notebookId,
        orgSlug,
        userId,
        imageEdit,
        correlationId,
        settlement,
      }),
    onEnd: async ({ messages: finishedMessages }) => {
      try {
        if (finishedMessages.length > 0) {
          await persistMessages({ notebookId, messages: finishedMessages });
        }
      } catch (err) {
        console.error("[chat] image-edit persistence failed:", err);
      }
    },
    onError: (error) =>
      reportAndSettleStreamError(error, {
        correlationId,
        endpoint: "chat.image-edit-stream",
        actorId: userId,
        settlement,
      }),
  });

  return createUIMessageStreamResponse({
    stream,
    headers: { "x-notebook-id": notebookId },
  });
}
