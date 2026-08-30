import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";
import { z } from "zod";

import { consentDestinations } from "../mcp-consent/origins";

/**
 * Listed from access tokens rather than consent records: a token is what
 * actually grants access, so an agent shows here exactly while it can still act
 * as the user.
 */
export const connectedAgentRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const grants = await ctx.db.oauthAccessToken.findMany({
      where: {
        userId: ctx.session.user.id,
        refreshTokenExpiresAt: { gt: new Date() },
      },
      select: {
        clientId: true,
        createdAt: true,
        application: { select: { name: true, redirectUrls: true } },
      },
      // `distinct` keeps the first row per client, so `desc` makes that the
      // newest grant.
      orderBy: { createdAt: "desc" },
      distinct: ["clientId"],
    });

    return grants.map((grant) => ({
      clientId: grant.clientId,
      name: grant.application.name,
      destinations: consentDestinations(grant.application.redirectUrls),
      connectedAt: grant.createdAt,
    }));
  }),

  revoke: protectedProcedure
    .input(z.object({ clientId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.db.$transaction([
        ctx.db.oauthAccessToken.deleteMany({
          where: { userId, clientId: input.clientId },
        }),
        // Without this the agent could walk straight back in: better-auth skips
        // the consent screen for a client the user has already approved.
        ctx.db.oauthConsent.deleteMany({
          where: { userId, clientId: input.clientId },
        }),
      ]);
    }),
});
