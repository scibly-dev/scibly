import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ CRON_SECRET: "test-cron-secret" }));

vi.mock("@/env", () => ({ env }));
const { isValidCronSecret, refuseUnauthorizedCron } =
  await import("./cron-route-guard");

const SECRET = "test-cron-secret";

function request(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://app.test/api/cron/anything", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  env.CRON_SECRET = SECRET;
});

describe("KD1: who gets through the door", () => {
  it.each([
    {
      case: "the bearer the scheduler sends",
      header: `Bearer ${SECRET}`,
      allowed: true,
    },
    { case: "no authorization header at all", header: null, allowed: false },
    { case: "an empty authorization header", header: "", allowed: false },
    {
      case: "a wrong secret of exactly the right length",
      header: "Bearer tset-cron-secret",
      allowed: false,
    },
    {
      case: "a bearer of a different length",
      header: "Bearer short",
      allowed: false,
    },
    {
      case: "the secret with no bearer scheme",
      header: SECRET,
      allowed: false,
    },
    {
      case: "the right secret with something appended",
      header: `Bearer ${SECRET}x`,
      allowed: false,
    },
  ])("$case → allowed: $allowed", ({ header, allowed }) => {
    expect(isValidCronSecret(header, SECRET)).toBe(allowed);
  });

  it("refuses an unauthorized caller with 401 and nothing about the secret", async () => {
    const response = refuseUnauthorizedCron(request("Bearer wrong"), "sync");

    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({ error: "Unauthorized" });
  });

  it("lets an authorized caller proceed", () => {
    expect(
      refuseUnauthorizedCron(request(`Bearer ${SECRET}`), "sync"),
    ).toBeNull();
  });
});

// KD2 (constant-time comparison) can't be tested directly — node:crypto isn't
// mockable here — but its two observable consequences are covered in the KD1
// table above.

describe("KD3: a deployment with no secret configured", () => {
  it.each([
    { case: "a caller with a plausible bearer", header: "Bearer anything" },
    { case: "a caller with none", header: undefined },
  ])("refuses $case with 500", async ({ header }) => {
    env.CRON_SECRET = "";

    const response = refuseUnauthorizedCron(request(header), "sync");

    expect(response?.status).toBe(500);
    expect(await response?.json()).toEqual({
      error: "CRON_SECRET is not configured",
    });
  });
});
