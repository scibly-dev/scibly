import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OAUTH_STATE_MAX_AGE_MS,
  signOAuthState,
  verifyOAuthState,
} from "./oauth-state";

const ISSUED_AT = new Date("2026-07-27T12:00:00.000Z");

const PAYLOAD = {
  orgSlug: "acme",
  provider: "NOTION",
  userId: "user-1",
  lang: "de",
};

function signatureOf(state: string) {
  return state.slice(state.lastIndexOf(".") + 1);
}

function forgeSignedState(payload: unknown) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", Buffer.from(process.env.ENCRYPTION_KEY ?? "", "hex"))
    .update(encoded)
    .digest("hex");
  return `${encoded}.${signature}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(ISSUED_AT);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LA2 a state we did not mint does not verify", () => {
  it("LA2 round-trips a state it signed itself", () => {
    const result = verifyOAuthState(signOAuthState(PAYLOAD));

    expect(result).toEqual({ ok: true, payload: PAYLOAD });
  });

  it("LA2 carries lang through, and tolerates its absence", () => {
    const withoutLang = { orgSlug: "acme", provider: "NOTION", userId: "u" };

    expect(verifyOAuthState(signOAuthState(withoutLang))).toEqual({
      ok: true,
      payload: withoutLang,
    });
  });

  const forgeries: [string, (valid: string) => string][] = [
    [
      "a payload edited under the original signature",
      (valid) =>
        `${Buffer.from(
          JSON.stringify({
            ...PAYLOAD,
            orgSlug: "victim",
            issuedAt: ISSUED_AT.getTime(),
          }),
        ).toString("base64url")}.${signatureOf(valid)}`,
    ],
    [
      "a signature of the right length but the wrong value",
      (valid) => `${valid.slice(0, valid.lastIndexOf("."))}.${"ab".repeat(32)}`,
    ],
    ["a signature of the wrong length", (valid) => valid.slice(0, -4)],
    ["nothing that looks like a signed state", () => "not-a-state"],
  ];

  it.each(forgeries)("LA2 refuses %s", (_case, forge) => {
    const result = verifyOAuthState(forge(signOAuthState(PAYLOAD)));

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  const malformedPayloads: [string, unknown][] = [
    ["no org", { provider: "NOTION", userId: "u", issuedAt: 0 }],
    ["no user", { orgSlug: "acme", provider: "NOTION", issuedAt: 0 }],
    ["no provider", { orgSlug: "acme", userId: "u", issuedAt: 0 }],
    ["no issue time", { orgSlug: "acme", provider: "NOTION", userId: "u" }],
    [
      "an org that is not a string",
      { orgSlug: 1, provider: "N", userId: "u", issuedAt: 0 },
    ],
    ["not an object at all", "acme"],
  ];

  it.each(malformedPayloads)(
    "LA2 refuses a correctly signed state with %s",
    (_case, payload) => {
      const result = verifyOAuthState(forgeSignedState(payload));

      expect(result).toEqual({ ok: false, reason: "invalid" });
    },
  );

  it("LA2 refuses a payload that is not JSON", () => {
    const encoded = Buffer.from("not json").toString("base64url");
    const signature = crypto
      .createHmac(
        "sha256",
        Buffer.from(process.env.ENCRYPTION_KEY ?? "", "hex"),
      )
      .update(encoded)
      .digest("hex");

    expect(verifyOAuthState(`${encoded}.${signature}`)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("LA3 a state does not stay redeemable forever", () => {
  const ages: [string, number, boolean][] = [
    ["immediately", 0, true],
    ["one tick before the limit", OAUTH_STATE_MAX_AGE_MS - 1, true],
    ["exactly at the limit", OAUTH_STATE_MAX_AGE_MS, true],
    ["one tick past the limit", OAUTH_STATE_MAX_AGE_MS + 1, false],
    ["a day later", 24 * 60 * 60 * 1000, false],
  ];

  it.each(ages)("LA3 redeemed %s", (_case, elapsed, accepted) => {
    const state = signOAuthState(PAYLOAD);
    vi.setSystemTime(new Date(ISSUED_AT.getTime() + elapsed));

    expect(verifyOAuthState(state).ok).toBe(accepted);
  });

  it("LA3 reports expiry separately from forgery", () => {
    const state = signOAuthState(PAYLOAD);
    vi.setSystemTime(
      new Date(ISSUED_AT.getTime() + OAUTH_STATE_MAX_AGE_MS + 1),
    );

    expect(verifyOAuthState(state)).toEqual({ ok: false, reason: "expired" });
  });

  it("LA3 refuses a state stamped in the future", () => {
    const state = forgeSignedState({
      ...PAYLOAD,
      issuedAt: ISSUED_AT.getTime() + 60_000,
    });

    expect(verifyOAuthState(state)).toEqual({ ok: false, reason: "expired" });
  });

  it("LA3 gives a consent screen ten minutes", () => {
    expect(OAUTH_STATE_MAX_AGE_MS).toBe(10 * 60 * 1000);
  });
});
