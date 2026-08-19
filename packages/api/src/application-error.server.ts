import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/unstable-core-do-not-import";

import { defaultLocale, type Locale } from "@scibly/i18n/constants";
import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";

import "server-only";

import { getInternalUnexpectedErrorMessage } from "./api-messages";
import { AppError } from "./application-error";
import { getRequestLocale } from "./request-locale";

export type NormalizedAppError = {
  code: TRPC_ERROR_CODE_KEY;
  applicationCode: string;
  message: string;
  correlationId: string;
  details?: unknown;
  cause: unknown;
  isUnexpected: boolean;
};

type NormalizeAppErrorContext = {
  correlationId?: string;
  locale?: Locale;
};

type ReportAppErrorContext = {
  endpoint: string;
  actorId?: string;
};

function prismaCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const name = "name" in error ? error.name : undefined;
  if (name !== "PrismaClientKnownRequestError") return undefined;
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" ? code : undefined;
}

function isAuthError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "APIError" ||
      error.name === "BetterAuthError" ||
      error.message === "Unauthorized")
  );
}

// better-auth plugins throw APIError with a business-rule status; carry it through instead of collapsing to "Unauthorized".
const BETTER_AUTH_BUSINESS_STATUSES = [
  "BAD_REQUEST",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYMENT_REQUIRED",
  "TOO_MANY_REQUESTS",
] as const satisfies readonly TRPC_ERROR_CODE_KEY[];

function betterAuthBusinessError(error: unknown) {
  if (
    !(error instanceof Error) ||
    (error.name !== "APIError" && error.name !== "BetterAuthError")
  ) {
    return undefined;
  }
  const status = "status" in error ? error.status : undefined;
  const code = BETTER_AUTH_BUSINESS_STATUSES.find(
    (candidate) => candidate === status,
  );
  return code ? { code, message: error.message } : undefined;
}

export function normalizeAppError(
  error: unknown,
  context: NormalizeAppErrorContext = {},
): NormalizedAppError {
  const correlationId = context.correlationId ?? crypto.randomUUID();

  if (error instanceof AppError) {
    return {
      code: error.code,
      applicationCode: error.applicationCode,
      message: error.message,
      correlationId,
      details: error.details,
      cause: error,
      isUnexpected: false,
    };
  }

  if (error instanceof TRPCError) {
    return {
      code: error.code,
      applicationCode: `api.${error.code.toLowerCase()}`,
      message: error.message,
      correlationId,
      cause: error,
      isUnexpected: false,
    };
  }

  if (error instanceof ZodError) {
    return {
      code: "BAD_REQUEST",
      applicationCode: "request.validation_failed",

      message: "The request could not be validated.",
      correlationId,
      cause: error,
      isUnexpected: false,
    };
  }

  const knownPrismaCode = prismaCode(error);
  if (knownPrismaCode === "P2025") {
    return {
      code: "NOT_FOUND",
      applicationCode: "data.not_found",
      message: "The requested resource was not found.",
      correlationId,
      cause: error,
      isUnexpected: false,
    };
  }
  if (knownPrismaCode === "P2002" || knownPrismaCode === "P2003") {
    return {
      code: "CONFLICT",
      applicationCode: "data.conflict",
      message: "The request conflicts with the current resource state.",
      correlationId,
      cause: error,
      isUnexpected: false,
    };
  }

  const businessError = betterAuthBusinessError(error);
  if (businessError) {
    return {
      code: businessError.code,
      applicationCode: `auth.${businessError.code.toLowerCase()}`,
      message: businessError.message,
      correlationId,
      cause: error,
      isUnexpected: false,
    };
  }

  if (isAuthError(error)) {
    return {
      code: "UNAUTHORIZED",
      applicationCode: "auth.unauthorized",
      message: "Unauthorized",
      correlationId,
      cause: error,
      isUnexpected: false,
    };
  }

  const locale = context.locale ?? getRequestLocale() ?? defaultLocale;
  return {
    code: "INTERNAL_SERVER_ERROR",
    applicationCode: "internal.unexpected",
    message: getInternalUnexpectedErrorMessage(locale),
    correlationId,
    cause: error,
    isUnexpected: true,
  };
}

const reportedErrors = new WeakSet<object>();

export function reportAppError(
  error: NormalizedAppError,
  context: ReportAppErrorContext,
): void {
  if (
    error.cause &&
    typeof error.cause === "object" &&
    reportedErrors.has(error.cause)
  ) {
    return;
  }
  if (error.cause && typeof error.cause === "object") {
    reportedErrors.add(error.cause);
  }

  const payload = {
    endpoint: context.endpoint,
    correlationId: error.correlationId,
    applicationCode: error.applicationCode,
    code: error.code,
    error:
      error.cause instanceof Error
        ? {
            name: error.cause.name,
            message: error.cause.message,
            stack: error.cause.stack,
          }
        : error.cause,
    actorId: context.actorId,
  };
  if (error.isUnexpected) {
    console.error(payload, "Unexpected application error");
  } else {
    console.warn(payload, "Application error");
  }
}

export function toTRPCError(error: NormalizedAppError): TRPCError {
  return new TRPCError({
    code: error.code,
    message: error.message,
    cause: error,
  });
}
