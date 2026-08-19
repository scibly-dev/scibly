import { AppError, getHttpStatus } from "@scibly/api/application-error";
import {
  normalizeAppError,
  reportAppError,
} from "@scibly/api/application-error/server";
import { getQueryClient } from "@scibly/api/query-client";
import { createContext, getTrpcRouteHandler } from "@scibly/api/server";
import { createTRPCContext } from "@scibly/api/trpc";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import "server-only";
import { type AppRouter, createCaller } from "@/server/api/root";

const caller = createCaller(createContext);
const createRouteContext = (headers: Headers) => createTRPCContext({ headers });
type RouteContext = NonNullable<
  Awaited<ReturnType<typeof createRouteContext>>
> & { correlationId: string };

export type ProtectedRouteContext = RouteContext & {
  session: NonNullable<RouteContext["session"]>;
};

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);

export { getTrpcRouteHandler };

export const protectedApiRoute = <TInput>(
  schema: z.ZodType<TInput>,
  handler: (
    input: TInput,
    ctx: ProtectedRouteContext,
    req: NextRequest,
  ) => Promise<Response> | Response,
) => {
  return async (req: NextRequest) => {
    let correlationId = req.headers.get("x-correlation-id") ?? undefined;
    let actorId: string | undefined;
    try {
      const ctx = await createRouteContext(req.headers);
      correlationId = ctx.correlationId ?? crypto.randomUUID();
      actorId = ctx.session?.user?.id;
      if (!ctx.session?.user) {
        throw new AppError({
          code: "UNAUTHORIZED",
          applicationCode: "auth.required",
          message: "Unauthorized",
        });
      }
      const routeContext: ProtectedRouteContext = {
        ...ctx,
        correlationId,
        session: ctx.session,
      };

      const json = await req.json();
      const parsed = schema.safeParse(json);

      if (!parsed.success) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "request.validation_failed",
          message: "The request could not be validated.",
          details: z.treeifyError(parsed.error),
        });
      }

      const response = await handler(parsed.data, routeContext, req);
      response.headers.set("x-correlation-id", routeContext.correlationId);
      return response;
    } catch (error) {
      const normalized = normalizeAppError(error, { correlationId });
      reportAppError(normalized, {
        endpoint: `${req.method} ${req.nextUrl.pathname}`,
        actorId,
      });
      return NextResponse.json(
        {
          code: normalized.applicationCode,
          message: normalized.message,
          correlationId: normalized.correlationId,
          details: normalized.details,
        },
        {
          status: getHttpStatus(normalized.code),
          headers: { "x-correlation-id": normalized.correlationId },
        },
      );
    }
  };
};
