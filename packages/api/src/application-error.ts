import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/unstable-core-do-not-import";

export type AppErrorOptions = {
  code: TRPC_ERROR_CODE_KEY;
  applicationCode: string;
  message: string;
  cause?: unknown;

  details?: unknown;
};

export class AppError extends Error {
  readonly code: TRPC_ERROR_CODE_KEY;
  readonly applicationCode: string;
  readonly details?: unknown;

  constructor({
    code,
    applicationCode,
    message,
    cause,
    details,
  }: AppErrorOptions) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.applicationCode = applicationCode;
    this.details = details;
  }
}

export function getHttpStatus(code: TRPC_ERROR_CODE_KEY): number {
  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "PAYMENT_REQUIRED":
      return 402;
    case "CONFLICT":
      return 409;
    case "TOO_MANY_REQUESTS":
      return 429;
    case "SERVICE_UNAVAILABLE":
      return 503;
    default:
      return 500;
  }
}

export function hasAppErrorCode(
  error: unknown,
  ...codes: TRPC_ERROR_CODE_KEY[]
): boolean {
  const seen = new Set<object>();
  let current = error;

  while (current !== null && typeof current === "object") {
    if (seen.has(current)) return false;
    seen.add(current);

    const code = "code" in current ? current.code : undefined;
    if (codes.some((candidate) => candidate === code)) return true;

    current = "cause" in current ? current.cause : undefined;
  }

  return false;
}
