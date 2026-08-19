import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@scibly/api/trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export type TrpcCaller = ReturnType<typeof createCaller>;
