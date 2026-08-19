import { createTRPCRouter, publicProcedure } from "@scibly/api/trpc";

export const healthRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),
});
