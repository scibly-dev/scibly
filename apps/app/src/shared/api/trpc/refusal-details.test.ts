import { AppError } from "@scibly/api/application-error";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// A refusal's `details` are the only way a server-counted number reaches the surface that fixes it.

vi.mock("@scibly/db", () => ({ db: {} }));
vi.mock("@scibly/auth/session", () => ({ getSession: async () => null }));

const { createTRPCRouter, publicProcedure } = await import("@scibly/api/trpc");

const router = createTRPCRouter({
  seatsExhausted: publicProcedure.query(() => {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "entitlement.seats_exhausted",
      message: "Not enough learner seats.",
      details: { shortfall: 3, remainingSeats: 0 },
    });
  }),
  plain: publicProcedure.query(() => {
    throw new Error("a Prisma driver would say something like this");
  }),
  validated: publicProcedure
    .input(z.object({ quantity: z.number() }))
    .query(() => null),
});

async function refusalData(path: string, input?: unknown) {
  const query = input
    ? `?input=${encodeURIComponent(JSON.stringify(input))}`
    : "";
  const response = await fetchRequestHandler({
    endpoint: "",
    req: new Request(`http://test/${path}${query}`),
    router,
    createContext: () => ({
      db: {} as never,
      session: null,
      headers: new Headers(),
      locale: "en" as never,
      correlationId: "corr-1",
      actor: null,
    }),
  });
  const body = (await response.json()) as { error: unknown };

  const { data } = superjson.deserialize(body.error as never) as {
    data: { applicationCode?: unknown; details?: unknown };
  };
  return data;
}

describe("what a refusal is allowed to tell the client", () => {
  it("carries the number the cap counted, beside the code that names it", async () => {
    const data = await refusalData("seatsExhausted");

    expect(data.applicationCode).toBe("entitlement.seats_exhausted");
    expect(data.details).toEqual({ shortfall: 3, remainingSeats: 0 });
  });

  it("carries nothing for a failure that authored no details", async () => {
    const data = await refusalData("plain");

    expect(data.details).toBeUndefined();
  });

  it("carries no error object, so a validation failure spills no message", async () => {
    const data = await refusalData("validated", { quantity: "three" });

    expect(data.applicationCode).toBe("request.validation_failed");
    expect(data.details).toBeUndefined();
  });
});
