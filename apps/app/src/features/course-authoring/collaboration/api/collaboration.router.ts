import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";

import { issueAuthorizedRoomToken } from "../server/issue-room-token";
import { issueRoomTokenSchema } from "./collaboration.schema";

export const collaborationRouter = createTRPCRouter({
  issueRoomToken: protectedProcedure
    .input(issueRoomTokenSchema)
    .mutation(async ({ input, ctx }) => ({
      token: await issueAuthorizedRoomToken({
        ...input,
        user: ctx.session.user,
      }),
    })),
});
