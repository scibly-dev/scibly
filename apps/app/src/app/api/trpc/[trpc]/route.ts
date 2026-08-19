import { appRouter } from "@/server/api/root";
import { getTrpcRouteHandler } from "@/shared/api/trpc/server";

export const handler = getTrpcRouteHandler(appRouter);

export { handler as GET, handler as POST };

export const maxDuration = 300;
