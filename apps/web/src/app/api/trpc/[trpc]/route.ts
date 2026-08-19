import { getTrpcRouteHandler } from "@scibly/api/server";

import { appRouter } from "@/server/api/root";

const handler = getTrpcRouteHandler(appRouter);

export { handler as GET, handler as POST };
