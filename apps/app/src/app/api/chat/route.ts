import { withRateLimit } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";

import { streamNotebookChat } from "@/features/notebook/chat/server/stream-chat";
import { streamChatSchema } from "@/features/notebook/chat/server/utils/schema";
import { ChatError } from "@/shared/ai/errors";
import { protectedApiRoute } from "@/shared/api/trpc/server";

export const MAX_CHAT_STREAMS_PER_WINDOW = 200;

/** Keyed by user+org, not notebook, so the ceiling can't be evaded by spinning up a new
 * workspace; the org slug is unvalidated request input, but that's safe since this key is
 * only read, and only incremented, after a successful turn. */
export function chatStreamRateLimitKey(
  userId: string,
  orgSlug: string,
): string {
  return `${userId}:${orgSlug}`;
}

export const POST = protectedApiRoute(streamChatSchema, (input, ctx, req) =>
  withRateLimit(
    {
      db,
      identifier: chatStreamRateLimitKey(ctx.session.user.id, input.orgSlug),
      endpoint: "chat.stream",
      maxPerWindow: MAX_CHAT_STREAMS_PER_WINDOW,
    },
    () => streamNotebookChat(input, ctx, req.signal),
    async () => {
      throw new ChatError("rate_limit:chat");
    },
  ),
);
