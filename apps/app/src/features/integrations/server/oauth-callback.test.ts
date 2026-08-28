import type { Prisma } from "@scibly/db";
import type { MockInstance } from "vitest";
import type { OAuthTokens } from "../contracts";

import { defaultLocale } from "@scibly/i18n/constants";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decryptApiKey } from "@/lib/crypto/api-key";
import { signOAuthState } from "@/lib/crypto/oauth-state";

// Exercises the full route handler; only the database, session, membership
// policy, and provider token exchange are mocked. The state signer is real.

const APP_URL = "http://localhost:3000";
const SETTINGS = `${APP_URL}/de/profile/org/acme/settings`;
const NOW = new Date("2026-07-27T12:00:00.000Z");

type UpsertArgs = Pick<
  Prisma.IntegrationConnectionUpsertArgs,
  "where" | "create" | "update"
>;

const db = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  integrationConnection: {
    findUnique: vi.fn(),
    upsert: vi.fn<(args: UpsertArgs) => Promise<unknown>>(),
  },
  notebookSource: { updateMany: vi.fn() },
}));
const getSession = vi.hoisted(() => vi.fn());
const requireOrgMember = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/auth/session", () => ({ getSession }));
vi.mock("@/features/organizations/server", () => ({ requireOrgMember }));

const { handleIntegrationOAuthCallback } = await import("./oauth-callback");
const { PROVIDERS } = await import("./registry");

const TOKENS: OAuthTokens = {
  accessToken: "secret-access-token",
  workspaceId: "workspace-1",
  workspaceName: "Acme HQ",
};

let exchangeCode: MockInstance<
  (code: string, redirectUri: string) => Promise<OAuthTokens>
>;

function state(overrides: Partial<Parameters<typeof signOAuthState>[0]> = {}) {
  return signOAuthState({
    orgSlug: "acme",
    provider: "NOTION",
    userId: "admin-1",
    lang: "de",
    ...overrides,
  });
}

async function callback(
  query: Record<string, string | undefined>,
  providerParam = "notion",
) {
  const url = new URL(`${APP_URL}/api/integrations/${providerParam}/callback`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return handleIntegrationOAuthCallback(new NextRequest(url), {
    params: Promise.resolve({ provider: providerParam }),
  });
}

function refusal(response: Response) {
  const location = new URL(response.headers.get("location") ?? "");
  return location.searchParams.get("integration_error");
}

function destination(response: Response) {
  const location = new URL(response.headers.get("location") ?? "");
  return `${location.origin}${location.pathname}`;
}

function upserted(): UpsertArgs {
  const call = db.integrationConnection.upsert.mock.calls[0]?.[0];
  if (!call) throw new Error("nothing was upserted");
  return call;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();

  getSession.mockResolvedValue({ user: { id: "admin-1" } });
  requireOrgMember.mockResolvedValue({ role: "admin" });
  db.organization.findUnique.mockResolvedValue({ id: "org-1" });
  db.integrationConnection.findUnique.mockResolvedValue(null);
  db.integrationConnection.upsert.mockResolvedValue({});
  db.notebookSource.updateMany.mockResolvedValue({ count: 0 });

  exchangeCode = vi
    .spyOn(PROVIDERS.NOTION, "exchangeCode")
    .mockResolvedValue(TOKENS);
});

afterEach(() => {
  vi.useRealTimers();
  exchangeCode.mockRestore();
});

describe("LA the door", () => {
  it("LA4 stores a token when the state, the session and the membership all agree", async () => {
    const response = await callback({ code: "auth-code", state: state() });

    expect(refusal(response)).toBeNull();
    expect(destination(response)).toBe(SETTINGS);
    expect(db.integrationConnection.upsert).toHaveBeenCalledTimes(1);
  });

  it("LA4 refuses a valid code redeemed by somebody else's session", async () => {
    getSession.mockResolvedValue({ user: { id: "someone-else" } });

    const response = await callback({ code: "auth-code", state: state() });

    expect(refusal(response)).toBe("session_mismatch");
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(db.integrationConnection.upsert).not.toHaveBeenCalled();
  });

  it("LA4 refuses a callback with no session at all", async () => {
    getSession.mockResolvedValue(null);

    const response = await callback({ code: "auth-code", state: state() });

    expect(refusal(response)).toBe("session_mismatch");
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("LA5 refuses somebody who is no longer an admin of the org", async () => {
    requireOrgMember.mockRejectedValue(new Error("FORBIDDEN"));

    const response = await callback({ code: "auth-code", state: state() });

    expect(refusal(response)).toBe("forbidden");
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(db.integrationConnection.upsert).not.toHaveBeenCalled();
  });

  it("LA5 demands admin or owner, not mere membership", async () => {
    await callback({ code: "auth-code", state: state() });

    expect(requireOrgMember).toHaveBeenCalledWith(
      "org-1",
      "admin-1",
      "admin_or_owner",
    );
  });

  it("LA6 takes the organization from the signed state, not the query string", async () => {
    const response = await callback({
      code: "auth-code",
      state: state(),
      orgSlug: "victim",
      organizationId: "org-victim",
    });

    expect(refusal(response)).toBeNull();
    expect(db.organization.findUnique).toHaveBeenCalledWith({
      where: { slug: "acme" },
      select: { id: true },
    });
    expect(upserted().create).toMatchObject({ organizationId: "org-1" });
  });

  it("LA6 refuses when the state's org does not exist", async () => {
    db.organization.findUnique.mockResolvedValue(null);

    const response = await callback({ code: "auth-code", state: state() });

    expect(refusal(response)).toBe("org_not_found");
  });

  it("LA8 refuses when the path segment names a different provider than the state", async () => {
    const response = await callback(
      { code: "auth-code", state: state() },
      "confluence",
    );

    expect(refusal(response)).toBe("state_mismatch");
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("LA8 accepts a path segment in any case, since the state decides", async () => {
    const response = await callback(
      { code: "auth-code", state: state() },
      "NOTION",
    );

    expect(refusal(response)).toBeNull();
  });

  it("LP2 refuses a state naming a provider the registry cannot build", async () => {
    const response = await callback(
      { code: "auth-code", state: state({ provider: "SHAREPOINT" }) },
      "sharepoint",
    );

    expect(refusal(response)).toBe("invalid_state");
    expect(db.integrationConnection.upsert).not.toHaveBeenCalled();
  });

  const badStates: [string, string | undefined, string][] = [
    ["no state", undefined, "missing_params"],
    ["a forged state", "forged.deadbeef", "invalid_state"],
  ];

  it.each(badStates)(
    "LA2 refuses %s and stores nothing",
    async (_case, given, reason) => {
      const response = await callback({ code: "auth-code", state: given });

      expect(refusal(response)).toBe(reason);
      expect(exchangeCode).not.toHaveBeenCalled();
      expect(db.integrationConnection.upsert).not.toHaveBeenCalled();
    },
  );

  it("LA3 refuses a state older than its window", async () => {
    const stale = state();
    vi.setSystemTime(new Date(NOW.getTime() + 11 * 60 * 1000));

    const response = await callback({ code: "auth-code", state: stale });

    expect(refusal(response)).toBe("expired_state");
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("LA7 refuses a callback carrying no code", async () => {
    const response = await callback({ state: state() });

    expect(refusal(response)).toBe("missing_params");
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("LA7 refuses a callback the user declined", async () => {
    const response = await callback({ error: "access_denied", state: state() });

    expect(refusal(response)).toBe("provider_denied");
    expect(exchangeCode).not.toHaveBeenCalled();
  });
});

describe("LS what is stored", () => {
  it("LS1 encrypts the access token, and what is stored decrypts back", async () => {
    await callback({ code: "auth-code", state: state() });
    const { create } = upserted();

    expect(create.accessTokenEncrypted).not.toBe(TOKENS.accessToken);
    expect(decryptApiKey(String(create.accessTokenEncrypted))).toBe(
      TOKENS.accessToken,
    );
  });

  it("LS3 keys the row on the org and the provider, so a second authorisation refreshes it", async () => {
    await callback({ code: "auth-code", state: state() });

    expect(upserted()).toMatchObject({
      where: {
        organizationId_provider: {
          organizationId: "org-1",
          provider: "NOTION",
        },
      },
    });
  });

  it("LS3 re-authorising the same workspace touches no sources", async () => {
    db.integrationConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      workspaceId: "workspace-1",
    });

    await callback({ code: "auth-code", state: state() });

    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
    expect(db.integrationConnection.upsert).toHaveBeenCalledTimes(1);
  });

  it("LS4 re-authorising a different workspace detaches the old workspace's sources", async () => {
    db.integrationConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      workspaceId: "workspace-old",
    });

    await callback({ code: "auth-code", state: state() });

    expect(db.notebookSource.updateMany).toHaveBeenCalledWith({
      where: { integrationId: "conn-1" },
      data: {
        integrationId: null,
        warning: expect.stringContaining("different workspace"),
      },
    });
  });

  it("LS4 treats a connection with no workspace recorded as a refresh, not a swap", async () => {
    db.integrationConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      workspaceId: null,
    });

    await callback({ code: "auth-code", state: state() });

    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
  });

  it("LS4 detaches before the tokens are overwritten", async () => {
    db.integrationConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      workspaceId: "workspace-old",
    });

    await callback({ code: "auth-code", state: state() });

    expect(
      db.notebookSource.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(
      db.integrationConnection.upsert.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("LD4 reconnecting after a disconnect does not revive the detached sources", async () => {
    db.integrationConnection.findUnique.mockResolvedValue(null);

    await callback({ code: "auth-code", state: state() });

    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
  });

  it("LS5 credits whoever authorised it, on a first connect and on a refresh", async () => {
    getSession.mockResolvedValue({ user: { id: "admin-2" } });

    await callback({ code: "auth-code", state: state({ userId: "admin-2" }) });
    const { create, update } = upserted();

    expect(create).toMatchObject({ connectedByUserId: "admin-2" });
    expect(update).toMatchObject({ connectedByUserId: "admin-2" });
  });

  it("LS3 exchanges the code against the redirect URI this app publishes", async () => {
    await callback({ code: "auth-code", state: state() }, "NoTiOn");

    expect(exchangeCode).toHaveBeenCalledWith(
      "auth-code",
      `${APP_URL}/api/integrations/notion/callback`,
    );
  });
});

describe("LF what a failure tells the admin", () => {
  it("LF1 sends a failed exchange back to the org's settings with a code", async () => {
    exchangeCode.mockRejectedValue(new Error("notion said no"));
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await callback({ code: "auth-code", state: state() });

    expect(destination(response)).toBe(SETTINGS);
    expect(refusal(response)).toBe("token_exchange_failed");
    error.mockRestore();
  });

  const providerErrors: [string, string][] = [
    ["access_denied", "provider_denied"],
    ["invalid_scope", "provider_error"],
    ["<script>alert(1)</script>", "provider_error"],
    ["temporarily_unavailable", "provider_error"],
  ];

  it.each(providerErrors)(
    "LF2 maps the provider's '%s' to one of our own codes",
    async (given, expected) => {
      const response = await callback({ error: given, state: state() });

      expect(refusal(response)).toBe(expected);
      expect(response.headers.get("location")).not.toContain("script");
    },
  );

  it("LF2 does not echo the provider's error even when there is no state to route by", async () => {
    const response = await callback({ error: "<script>alert(1)</script>" });

    expect(refusal(response)).toBe("provider_error");
  });

  it("LF3 falls back to the profile page when there is no org to return to", async () => {
    const response = await callback({
      code: "auth-code",
      state: "forged.beef",
    });

    expect(destination(response)).toBe(`${APP_URL}/${defaultLocale}/profile`);
  });

  it("LF3 honours the language the flow started in", async () => {
    const response = await callback({
      code: "auth-code",
      state: state({ lang: "en" }),
    });

    expect(destination(response)).toBe(
      `${APP_URL}/en/profile/org/acme/settings`,
    );
  });

  it("LF3 refuses to build a redirect around a language we do not serve", async () => {
    const response = await callback({
      code: "auth-code",
      state: state({ lang: "fr" }),
    });

    expect(destination(response)).toBe(
      `${APP_URL}/${defaultLocale}/profile/org/acme/settings`,
    );
  });
});
