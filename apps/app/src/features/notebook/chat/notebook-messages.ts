import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { safeValidateUIMessages } from "ai";

import { encodeNotebookMessageCursorFromMessage } from "@/features/notebook/chat/notebook-message-cursor";
import { CLIENT_ONLY_NOTEBOOK_TOOLS } from "@/features/notebook/chat/tools/client-tool-definitions";

type StoredNotebookMessageRow = {
  id: string;
  role: string;
  parts: unknown;
  createdAt: Date | string;
};

function mapStoredNotebookMessageRowToMessage(
  row: StoredNotebookMessageRow,
): NotebookMessage | null {
  const role = row.role.toLowerCase();
  if (role !== "user" && role !== "assistant") return null;
  if (!Array.isArray(row.parts) || row.parts.length === 0) return null;

  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : new Date(row.createdAt).toISOString();

  return {
    id: row.id,
    role,
    // SAFETY: stored JSON, checked for real by `safeValidateUIMessages` in `readableMessage`, which every message this module hands out goes through.
    parts: row.parts as NotebookMessage["parts"],
    metadata: { createdAt },
  };
}

// Only browser-run tools are known here; the validator skips any tool it has no schema for as long as the call has settled, which `repairInterruptedToolParts` guarantees for every server-run call it stores.
async function validate(
  message: NotebookMessage,
): Promise<NotebookMessage | null> {
  const result = await safeValidateUIMessages<NotebookMessage>({
    messages: [message],
    tools: CLIENT_ONLY_NOTEBOOK_TOOLS,
  });

  return result.success ? (result.data[0] ?? null) : null;
}

// A tool call can go stale if its schema changed since the row was written, so parts are re-checked individually and only the unreadable ones dropped (taking their paired result with them, as providers require) before the survivors are validated together.
async function readableMessage(
  message: NotebookMessage,
): Promise<NotebookMessage | null> {
  const whole = await validate(message);
  if (whole) return whole;

  const readableParts = (
    await Promise.all(
      message.parts.map((part) => validate({ ...message, parts: [part] })),
    )
  ).flatMap((valid) => valid?.parts ?? []);

  if (readableParts.length === 0) return null;

  return await validate({ ...message, parts: readableParts });
}

export async function notebookMessageRowsToMessages(
  rows: StoredNotebookMessageRow[],
): Promise<NotebookMessage[]> {
  const validated = await Promise.all(
    rows.map(async (row) => {
      const message = mapStoredNotebookMessageRowToMessage(row);
      return message && (await readableMessage(message));
    }),
  );

  return validated.filter((message) => message !== null);
}

export function oldestNotebookMessageToCursor(
  message: NotebookMessage,
): string | null {
  const createdAt = message.metadata?.createdAt;
  if (!createdAt) return null;
  if (message.role !== "user" && message.role !== "assistant") return null;

  return encodeNotebookMessageCursorFromMessage({
    createdAt,
    role: message.role,
    id: message.id,
  });
}
