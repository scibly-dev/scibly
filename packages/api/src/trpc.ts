import { getSession } from "@scibly/auth/session";
import { db } from "@scibly/db";
import { resolveLocaleFromHeaders } from "@scibly/i18n/resolve-locale-from-headers";
import {
  formatZodErrorForTrpc,
  summarizeZodError,
} from "@scibly/schemas/zod-i18n";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { AppError } from "./application-error";
import {
  normalizeAppError,
  type NormalizedAppError,
  reportAppError,
  toTRPCError,
} from "./application-error.server";
import { getRequestLocale, runWithRequestLocale } from "./request-locale";

type TRPCContext = {
  db: typeof db;
  session: Awaited<ReturnType<typeof getSession>>;
  headers: Headers;
  locale: ReturnType<typeof resolveLocaleFromHeaders>;
  correlationId?: string;
  actor?: { userId: string } | null;
};

export const createTRPCContext = async (opt: {
  headers: Headers;
}): Promise<TRPCContext> => {
  const session = await getSession(opt.headers);
  const locale = resolveLocaleFromHeaders(opt.headers);
  const suppliedCorrelationId = opt.headers.get("x-correlation-id");
  const correlationId =
    suppliedCorrelationId &&
    /^[a-zA-Z0-9._:-]{1,128}$/.test(suppliedCorrelationId)
      ? suppliedCorrelationId
      : crypto.randomUUID();

  return {
    db,
    session,
    ...opt,
    locale,
    correlationId,
    actor: session?.user ? { userId: session.user.id } : null,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  sse: {
    ping: {
      enabled: true,
      intervalMs: 15_000,
    },
    client: {
      reconnectAfterInactivityMs: 20_000,
    },
  },
  // eslint-disable-next-line anti-slop/no-shape-in-symbol-names -- tRPC owns this parameter name; only our alias is ours to pick.
  errorFormatter({ shape: wireError, error, ctx }) {
    const locale = ctx?.locale ?? getRequestLocale();
    const zodCause = error.cause instanceof ZodError ? error.cause : null;
    const normalizedCause = isNormalizedAppError(error.cause)
      ? error.cause
      : null;

    if (zodCause && locale) {
      const zodError = formatZodErrorForTrpc(zodCause, locale);
      const summary = summarizeZodError(zodCause, locale);
      return {
        ...wireError,
        message: summary || wireError.message,
        data: {
          ...wireError.data,
          zodError,
          correlationId: ctx?.correlationId,
          applicationCode:
            normalizedCause?.applicationCode ?? "request.validation_failed",
        },
      };
    }

    const details = normalizedCause?.details;
    return {
      ...wireError,
      data: {
        ...wireError.data,
        zodError: zodCause ? zodCause.flatten() : null,
        correlationId: normalizedCause?.correlationId ?? ctx?.correlationId,
        applicationCode: normalizedCause?.applicationCode,
        details: isPublishable(details) ? details : undefined,
      },
    };
  },
});

// Only a plain object travels — an Error's message or stack must never leak through this field.
function isPublishable(details: unknown): details is object {
  return (
    typeof details === "object" &&
    details !== null &&
    Object.getPrototypeOf(details) === Object.prototype
  );
}

function isNormalizedAppError(value: unknown): value is NormalizedAppError {
  return (
    value !== null &&
    typeof value === "object" &&
    "correlationId" in value &&
    "applicationCode" in value
  );
}

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;
export const mergeTRPCRouters = t.mergeRouters;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

const localeMiddleware = t.middleware(async ({ ctx, next }) => {
  return runWithRequestLocale(ctx.locale, next);
});

const applicationErrorMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const correlationId = ctx.correlationId ?? crypto.randomUUID();
  const result = await next({
    ctx: {
      correlationId,
    },
  });
  if (!result.ok) {
    const normalized = normalizeAppError(result.error.cause ?? result.error, {
      correlationId,
      locale: ctx.locale,
    });
    reportAppError(normalized, {
      endpoint: path,
      actorId: ctx.actor?.userId ?? ctx.session?.user?.id,
    });

    throw toTRPCError(normalized);
  }
  return result;
});

export const publicProcedure = t.procedure
  .use(applicationErrorMiddleware)
  .use(localeMiddleware)
  .use(timingMiddleware);

export const protectedProcedure = t.procedure
  .use(applicationErrorMiddleware)
  .use(localeMiddleware)
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new AppError({
        code: "UNAUTHORIZED",
        applicationCode: "auth.required",
        message: "Unauthorized",
      });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
        actor: { userId: ctx.session.user.id },
        correlationId: ctx.correlationId ?? crypto.randomUUID(),
      },
    });
  });
