import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { AppError } from "@scibly/api/application-error";
import { ChatRole, db } from "@scibly/db";

import { chronologicallyAfter } from "@/features/notebook/chat/notebook-message-cursor";
import { notebookMessageRowsToMessages } from "@/features/notebook/chat/notebook-messages";
import { repairInterruptedToolParts } from "@/features/notebook/chat/server/utils/client-message-merge";
import {
  NOTEBOOK_MESSAGE_NEWEST_FIRST_ORDER,
  sortNotebookMessageTimeline,
} from "@/shared/ai/chat/message-order";

export async function loadNotebookMessages(
  notebookId: string,
  after?: string,
): Promise<NotebookMessage[]> {
  const cutoff = after
    ? await db.notebookChat.findFirst({
        where: { id: after, notebookId },
        select: { createdAt: true, role: true, id: true },
      })
    : null;

  const storedMessages = await db.notebookChat.findMany({
    where: {
      notebookId,
      OR: cutoff ? chronologicallyAfter(cutoff).OR : undefined,
    },
    orderBy: NOTEBOOK_MESSAGE_NEWEST_FIRST_ORDER,
    select: {
      id: true,
      role: true,
      parts: true,
      createdAt: true,
    },
  });

  return await notebookMessageRowsToMessages(
    sortNotebookMessageTimeline(storedMessages),
  );
}

export function changedMessages(
  stored: NotebookMessage[],
  current: NotebookMessage[],
): NotebookMessage[] {
  const before = new Map(
    stored.map((message) => [message.id, JSON.stringify(message.parts)]),
  );
  return current.filter(
    (message) => before.get(message.id) !== JSON.stringify(message.parts),
  );
}

export async function persistMessages({
  notebookId,
  messages,
}: {
  notebookId: string;
  messages: NotebookMessage[];
}) {
  const withIds = messages.map((msg) => ({
    ...repairInterruptedToolParts(msg),
    id: msg.id && msg.id !== "" ? msg.id : crypto.randomUUID(),
  }));

  const existing = await db.notebookChat.findMany({
    where: { id: { in: withIds.map((m) => m.id) } },
    select: { id: true, notebookId: true },
  });

  const foreignId = existing.find((row) => row.notebookId !== notebookId);
  if (foreignId) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message: "Message does not belong to this notebook.",
    });
  }

  // SAFETY: `parts` is the AI SDK's own message shape, on its way into a JSON

  const ops = withIds.map((msg, index) =>
    db.notebookChat.upsert({
      where: { id: msg.id },
      create: {
        id: msg.id,
        notebookId,
        role: msg.role === "user" ? ChatRole.USER : ChatRole.ASSISTANT,
        parts: msg.parts as object[],
        createdAt: new Date(Date.now() + index),
      },
      update: {
        parts: msg.parts as object[],
      },
    }),
  );

  await db.$transaction(ops);
}
