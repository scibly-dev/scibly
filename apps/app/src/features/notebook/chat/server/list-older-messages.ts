import { type ChatRole, db } from "@scibly/db";

import {
  chronologicallyBefore,
  decodeNotebookMessageCursor,
  encodeNotebookMessageCursor,
  NOTEBOOK_MESSAGE_UI_PAGE_SIZE,
} from "@/features/notebook/chat/notebook-message-cursor";
import { sortNotebookMessageTimeline } from "@/shared/ai/chat/message-order";

export type NotebookMessageListRow = {
  id: string;
  role: ChatRole;
  parts: unknown;
  createdAt: Date;
};

export async function listOlderNotebookMessages(
  notebookId: string,
  beforeCursor: string,
  limit = NOTEBOOK_MESSAGE_UI_PAGE_SIZE,
): Promise<{
  items: NotebookMessageListRow[];
  nextOlderCursor?: string;
}> {
  const cursor = decodeNotebookMessageCursor(beforeCursor);

  const rows = await db.notebookChat.findMany({
    where: {
      notebookId,
      ...chronologicallyBefore(cursor),
    },
    orderBy: [{ createdAt: "desc" }, { role: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: { id: true, role: true, parts: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const items = sortNotebookMessageTimeline(rows.slice(0, limit));
  const oldest = items[0];

  return {
    items,
    nextOlderCursor:
      hasMore && oldest
        ? encodeNotebookMessageCursor({
            createdAt: oldest.createdAt,
            role: oldest.role,
            id: oldest.id,
          })
        : undefined,
  };
}
