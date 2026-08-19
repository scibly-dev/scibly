import { getUtcBucketStart } from "@scibly/api/rate-limit";
import { Prisma } from "@scibly/db/client";
import { vi } from "vitest";

interface CounterRow {
  identifier: string;
  endpoint: string;
  windowStart: Date;
  count?: { lt?: number; gt?: number };
}

/**
 * In-memory stand-in for the `RateLimit` table: since `withRateLimit` reverts
 * its conditional `UPDATE ... WHERE count < max` on failure, a test reads the
 * window state through `spent()`/`setSpent()` rather than the call log — pass
 * `bucketSizeMs` if the endpoint under test isn't on the hour default, since
 * both must name the same window the code writes to.
 */
export function rateLimitCounter(bucketSizeMs?: number) {
  const windows = new Map<string, number>();
  const keyOf = (row: {
    identifier: string;
    endpoint: string;
    windowStart: Date;
  }) => `${row.identifier}|${row.endpoint}|${row.windowStart.toISOString()}`;

  const currentKey = (identifier: string, endpoint: string) =>
    keyOf({
      identifier,
      endpoint,
      windowStart: getUtcBucketStart(new Date(), bucketSizeMs),
    });

  return {
    model: {
      updateMany: vi.fn(
        ({
          where,
          data,
        }: {
          where: CounterRow;
          data: { count: { increment?: number; decrement?: number } };
        }) => {
          const key = keyOf(where);
          const held = windows.get(key);

          if (held === undefined) return Promise.resolve({ count: 0 });
          if (where.count?.lt !== undefined && held >= where.count.lt) {
            return Promise.resolve({ count: 0 });
          }
          if (where.count?.gt !== undefined && held <= where.count.gt) {
            return Promise.resolve({ count: 0 });
          }

          const moved =
            held + (data.count.increment ?? 0) - (data.count.decrement ?? 0);
          windows.set(key, moved);
          return Promise.resolve({ count: 1 });
        },
      ),
      findUnique: vi.fn(
        ({
          where,
        }: {
          where: {
            identifier_endpoint_windowStart: {
              identifier: string;
              endpoint: string;
              windowStart: Date;
            };
          };
        }) => {
          const held = windows.get(
            keyOf(where.identifier_endpoint_windowStart),
          );
          return Promise.resolve(held === undefined ? null : { count: held });
        },
      ),
      create: vi.fn(
        ({
          data,
        }: {
          data: CounterRow & { count: number };
        }): Promise<unknown> => {
          const key = keyOf(data);
          if (windows.has(key)) {
            return Promise.reject(
              new Prisma.PrismaClientKnownRequestError(
                "Unique constraint failed",
                { code: "P2002", clientVersion: "7.8.0" },
              ),
            );
          }
          windows.set(key, data.count);
          return Promise.resolve(data);
        },
      ),
    },

    spent(identifier: string, endpoint: string): number {
      return windows.get(currentKey(identifier, endpoint)) ?? 0;
    },

    setSpent(identifier: string, endpoint: string, count: number): void {
      windows.set(currentKey(identifier, endpoint), count);
    },

    keys(): string[] {
      return [...windows.keys()];
    },

    clear(): void {
      windows.clear();
    },
  };
}
