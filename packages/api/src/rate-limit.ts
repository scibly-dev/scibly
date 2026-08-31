import { Prisma, type PrismaClient } from "@scibly/db/client";

import "server-only";

import { AppError } from "./application-error";

export const TimeHelpers = {
  IN_SECONDS: {
    SECOND: 1,
    MINUTE: 60,
    HOUR: 60 * 60,
    DAY: 60 * 60 * 24,
  },
  IN_MS: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 60 * 60 * 24 * 1000,
  },
} as const;

export const getUtcBucketStart = (
  date: Date,
  bucketSizeMs: number = TimeHelpers.IN_MS.HOUR,
): Date => {
  if (!Number.isFinite(bucketSizeMs) || bucketSizeMs <= 0) {
    throw new Error("bucketSizeMs must be a positive finite number");
  }

  const utc = date.getTime();
  const bucketStart = Math.floor(utc / bucketSizeMs) * bucketSizeMs;
  return new Date(bucketStart);
};

/**
 * Behind a proxy the socket address is the proxy's, so the forwarded header is
 * what varies per client; an unreadable one falls into one shared bucket rather
 * than escaping the limit.
 */
export const clientIp = (headers: Headers): string =>
  headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  headers.get("x-real-ip") ??
  "unknown";

type RateLimitIdentifier = {
  db: PrismaClient;
  identifier: string;
  endpoint: string;
};

type WithRateLimitParams<T = unknown> = RateLimitIdentifier & {
  windowStart?: Date;
  maxPerWindow: number;

  tooManyRequestsMessage?: string;

  refundIf?: (result: T) => boolean;
};

const reserveSlot = async ({
  db,
  identifier,
  endpoint,
  windowStart,
  maxPerWindow,
}: RateLimitIdentifier & {
  windowStart: Date;
  maxPerWindow: number;
}): Promise<boolean> => {
  const row = { identifier, endpoint, windowStart };

  const take = async () =>
    (
      await db.rateLimit.updateMany({
        where: { ...row, count: { lt: maxPerWindow } },
        data: { count: { increment: 1 } },
      })
    ).count > 0;

  if (await take()) return true;

  const existing = await db.rateLimit.findUnique({
    where: { identifier_endpoint_windowStart: row },
    select: { count: true },
  });

  if (existing) return existing.count < maxPerWindow ? take() : false;

  try {
    await db.rateLimit.create({ data: { ...row, count: 1 } });
    return true;
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    return take();
  }
};

export const withRateLimit = async <T>(
  {
    db,
    identifier,
    endpoint,
    windowStart = getUtcBucketStart(new Date()),
    maxPerWindow,
    tooManyRequestsMessage,
    refundIf,
  }: WithRateLimitParams<T>,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>,
): Promise<T> => {
  const reserved = await reserveSlot({
    db,
    identifier,
    endpoint,
    windowStart,
    maxPerWindow,
  });

  if (!reserved) {
    if (fallback) {
      return fallback();
    }
    throw new AppError({
      code: "TOO_MANY_REQUESTS",
      applicationCode: "rate_limit.exceeded",
      message: tooManyRequestsMessage ?? "Rate limit exceeded",
    });
  }

  const refund = () =>
    db.rateLimit
      .updateMany({
        where: { identifier, endpoint, windowStart, count: { gt: 0 } },
        data: { count: { decrement: 1 } },
      })
      .catch(() => undefined);

  try {
    const result = await fn();
    if (refundIf?.(result)) await refund();
    return result;
  } catch (error) {
    await refund();
    throw error;
  }
};
