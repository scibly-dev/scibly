import { createTestPrismaClient } from "@scibly/db/test-client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getUtcBucketStart, withRateLimit } from "./rate-limit";

// A fake DB runs one statement at a time and can't witness the race a real DB settles, so this
// needs a live database: set RATE_LIMIT_INT_TEST_DATABASE_URL (opt-in, skipped otherwise; see
// docs/integration-tests.md).
const url = process.env.RATE_LIMIT_INT_TEST_DATABASE_URL ?? "";

const RUN_ID = `int-rl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ENDPOINT = `${RUN_ID}-endpoint`;

describe.runIf(url !== "")("IT — one window, many callers at once", () => {
  const db = createTestPrismaClient(url);
  const windowStart = getUtcBucketStart(new Date("2026-02-01T12:34:56Z"));

  const request = (identifier: string, maxPerWindow: number) =>
    withRateLimit(
      { db, identifier, endpoint: ENDPOINT, windowStart, maxPerWindow },
      async () => "served",
      async () => "refused",
    );

  const held = (identifier: string) =>
    db.rateLimit.findUnique({
      where: {
        identifier_endpoint_windowStart: {
          identifier,
          endpoint: ENDPOINT,
          windowStart,
        },
      },
    });

  beforeAll(async () => {
    await db.rateLimit.deleteMany({ where: { endpoint: ENDPOINT } });
  });

  afterEach(async () => {
    await db.rateLimit.deleteMany({ where: { endpoint: ENDPOINT } });
  });

  afterAll(async () => {
    await db.rateLimit.deleteMany({ where: { endpoint: ENDPOINT } });
    await db.$disconnect();
  });

  it("ten callers racing for three slots take three, not ten", async () => {
    const actor = `${RUN_ID}-race`;

    const outcomes = await Promise.all(
      Array.from({ length: 10 }, () => request(actor, 3)),
    );

    expect(outcomes.filter((o) => o === "served")).toHaveLength(3);
    expect((await held(actor))?.count).toBe(3);
  });

  it("the last slot goes to exactly one of two callers arriving together", async () => {
    const actor = `${RUN_ID}-last`;
    await db.rateLimit.create({
      data: { identifier: actor, endpoint: ENDPOINT, windowStart, count: 2 },
    });

    const outcomes = await Promise.all([request(actor, 3), request(actor, 3)]);

    expect(outcomes.filter((o) => o === "served")).toHaveLength(1);
    expect((await held(actor))?.count).toBe(3);
  });

  it("callers colliding on an empty window are all counted once", async () => {
    const actor = `${RUN_ID}-first`;

    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () => request(actor, 5)),
    );

    expect(outcomes.filter((o) => o === "served")).toHaveLength(5);
    expect((await held(actor))?.count).toBe(5);
  });

  it("a window is counted per author and per endpoint", async () => {
    const busy = `${RUN_ID}-busy`;
    const quiet = `${RUN_ID}-quiet`;

    expect(await request(busy, 1)).toBe("served");
    expect(await request(busy, 1)).toBe("refused");
    expect(await request(quiet, 1)).toBe("served");

    const other = await withRateLimit(
      {
        db,
        identifier: busy,
        endpoint: `${ENDPOINT}-other`,
        windowStart,
        maxPerWindow: 1,
      },
      async () => "served",
      async () => "refused",
    );
    expect(other).toBe("served");

    await db.rateLimit.deleteMany({ where: { endpoint: `${ENDPOINT}-other` } });
  });

  it("the next window starts the count again", async () => {
    const actor = `${RUN_ID}-window`;
    expect(await request(actor, 1)).toBe("served");
    expect(await request(actor, 1)).toBe("refused");

    const next = await withRateLimit(
      {
        db,
        identifier: actor,
        endpoint: ENDPOINT,
        windowStart: new Date(windowStart.getTime() + 60 * 60 * 1000),
        maxPerWindow: 1,
      },
      async () => "served",
      async () => "refused",
    );

    expect(next).toBe("served");
  });

  it("work that throws hands its slot back", async () => {
    const actor = `${RUN_ID}-refund`;

    await expect(
      withRateLimit(
        {
          db,
          identifier: actor,
          endpoint: ENDPOINT,
          windowStart,
          maxPerWindow: 1,
        },
        async () => {
          throw new Error("the work failed");
        },
      ),
    ).rejects.toThrow("the work failed");

    expect((await held(actor))?.count).toBe(0);
    expect(await request(actor, 1)).toBe("served");
  });

  it("work that did nothing hands its slot back too", async () => {
    const actor = `${RUN_ID}-noop`;
    const found = (count: number) =>
      withRateLimit(
        {
          db,
          identifier: actor,
          endpoint: ENDPOINT,
          windowStart,
          maxPerWindow: 1,
          refundIf: (result: number) => result === 0,
        },
        async () => count,
      );

    expect(await found(0)).toBe(0);
    expect((await held(actor))?.count).toBe(0);

    expect(await found(4)).toBe(4);
    expect((await held(actor))?.count).toBe(1);
    expect(await request(actor, 1)).toBe("refused");
  });
});
