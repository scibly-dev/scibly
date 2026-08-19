import { AppError } from "@scibly/api/application-error";
import { ChatRole } from "@scibly/db/enums";

export const NOTEBOOK_MESSAGE_UI_PAGE_SIZE = 20;

export interface NotebookMessageCursor {
  createdAt: Date;
  role: ChatRole;
  id: string;
}

export function encodeNotebookMessageCursor(
  cursor: NotebookMessageCursor,
): string {
  return `${cursor.createdAt.toISOString()}|${cursor.role}|${cursor.id}`;
}

function invalidCursor(): AppError {
  return new AppError({
    code: "BAD_REQUEST",
    applicationCode: "api.bad_request",
    message: "Invalid pagination cursor.",
  });
}

export function decodeNotebookMessageCursor(
  raw: string,
): NotebookMessageCursor {
  const firstSep = raw.indexOf("|");
  const lastSep = raw.lastIndexOf("|");
  if (firstSep <= 0 || lastSep <= firstSep) {
    throw invalidCursor();
  }

  const createdAt = new Date(raw.slice(0, firstSep));
  const role = raw.slice(firstSep + 1, lastSep);
  const id = raw.slice(lastSep + 1);

  if (
    Number.isNaN(createdAt.getTime()) ||
    !id ||
    (role !== ChatRole.USER && role !== ChatRole.ASSISTANT)
  ) {
    throw invalidCursor();
  }

  return { createdAt, role, id };
}

// On a same-instant tie this reads id before role, the reverse of `sortNotebookMessageTimeline`'s role-first order, so it could pull in a later ASSISTANT message — a gap only two messages persisted in the same millisecond could hit, which `persistMessages` avoids by spacing batches out.
export function chronologicallyBefore(cursor: NotebookMessageCursor) {
  if (cursor.role === ChatRole.USER) {
    return {
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }

  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, role: ChatRole.USER },
      {
        createdAt: cursor.createdAt,
        role: ChatRole.ASSISTANT,
        id: { lt: cursor.id },
      },
    ],
  };
}

// Matches `sortNotebookMessageTimeline` exactly: same instant puts USER ahead of ASSISTANT, then id decides.
export function chronologicallyAfter(cursor: NotebookMessageCursor) {
  if (cursor.role === ChatRole.ASSISTANT) {
    return {
      OR: [
        { createdAt: { gt: cursor.createdAt } },
        {
          createdAt: cursor.createdAt,
          role: ChatRole.ASSISTANT,
          id: { gt: cursor.id },
        },
      ],
    };
  }

  return {
    OR: [
      { createdAt: { gt: cursor.createdAt } },
      { createdAt: cursor.createdAt, role: ChatRole.ASSISTANT },
      {
        createdAt: cursor.createdAt,
        role: ChatRole.USER,
        id: { gt: cursor.id },
      },
    ],
  };
}

export function encodeNotebookMessageCursorFromMessage({
  createdAt,
  role,
  id,
}: {
  createdAt: string;
  role: "user" | "assistant";
  id: string;
}): string {
  return encodeNotebookMessageCursor({
    createdAt: new Date(createdAt),
    role: role === "user" ? ChatRole.USER : ChatRole.ASSISTANT,
    id,
  });
}
