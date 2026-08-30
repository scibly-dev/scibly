import type * as HandlerModule from "@/features/mcp/server/handler";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const counter = await vi.hoisted(async () =>
  (await import("@test/mocks/rate-limit-counter")).rateLimitCounter(),
);

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  rateLimit: counter.model,
}));

const auth = vi.hoisted(() => ({
  auth: { api: { getMcpSession: vi.fn() } },
}));

const policy = vi.hoisted(() => ({ resolveTenantContext: vi.fn() }));
const handler = vi.hoisted(() => ({ handleMcpRequest: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/auth/config", () => auth);
vi.mock("@/features/organizations/server/policy", () => policy);
vi.mock("@/server/api/root", () => ({ createCaller: vi.fn(() => ({})) }));
vi.mock("@/features/mcp/server/handler", async (importOriginal) => ({
  ...(await importOriginal<typeof HandlerModule>()),
  handleMcpRequest: handler.handleMcpRequest,
}));

const { POST, MAX_MCP_REQUESTS_PER_WINDOW } = await import("./route");

const ORG = "acme";
const USER = { id: "user-1", email: "author@acme.test" };
const ROUTE_URL = "https://app.scibly.com/api/org/acme/mcp";

const HOUR = 60 * 60 * 1000;

function request() {
  return new Request(ROUTE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer tok-1",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
}

function post(orgSlug = ORG) {
  return POST(request(), { params: Promise.resolve({ orgSlug }) });
}

type McpToken = {
  userId: string | null;
  clientId: string;
  accessToken: string;
  accessTokenExpiresAt: Date | undefined;
};

function grant(overrides: Partial<McpToken> = {}): McpToken {
  return {
    userId: USER.id,
    clientId: "client-1",
    accessToken: "tok-1",
    accessTokenExpiresAt: new Date(Date.now() + HOUR),
    ...overrides,
  };
}

function memberOf(organizationId = "org-1") {
  policy.resolveTenantContext.mockResolvedValue({
    organization: { id: organizationId },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  counter.clear();
  db.user.findUnique.mockResolvedValue(USER);
  handler.handleMcpRequest.mockResolvedValue(
    Response.json({ jsonrpc: "2.0", id: 1, result: { tools: [] } }),
  );
});

describe("turning a bearer token into an authorized MCP request", () => {
  it("MCP2: sends an agent with no token to the resource metadata", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(null);

    const response = await post();

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Bearer resource_metadata="https://app.scibly.com/.well-known/oauth-protected-resource"',
    );
    expect(response.headers.get("Access-Control-Expose-Headers")).toBe(
      "WWW-Authenticate",
    );
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: refuses a token that names no user", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(grant({ userId: null }));

    expect((await post()).status).toBe(401);
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: refuses an expired token", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(
      grant({ accessTokenExpiresAt: new Date(Date.now() - HOUR) }),
    );

    expect((await post()).status).toBe(401);
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: refuses a token whose expiry cannot be read", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(
      grant({ accessTokenExpiresAt: undefined }),
    );
    memberOf();

    expect((await post()).status).toBe(401);
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: refuses a token whose user has since been deleted", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(grant());
    db.user.findUnique.mockResolvedValue(null);

    expect((await post()).status).toBe(401);
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });
});

describe("confining a request to the organization in its URL", () => {
  beforeEach(() => auth.auth.api.getMcpSession.mockResolvedValue(grant()));

  it.each([
    ["is not a member of", "FORBIDDEN", "organization.access_denied"],
    [
      "cannot see, because it does not exist",
      "NOT_FOUND",
      "organization.not_found",
    ],
  ] as const)(
    "MCP2: refuses an organization the token's user %s",
    async (_case, code, applicationCode) => {
      policy.resolveTenantContext.mockRejectedValue(
        new AppError({ code, applicationCode, message: "no" }),
      );

      const response = await post("rival");

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        jsonrpc: "2.0",
        error: { code: -32001 },
      });
      expect(handler.handleMcpRequest).not.toHaveBeenCalled();
    },
  );

  it("MCP2: reports a failed membership lookup as a failure, not a refusal", async () => {
    policy.resolveTenantContext.mockRejectedValue(new Error("connection lost"));

    const response = await post();

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32603 },
    });
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: takes the organization from the URL, never from the agent", async () => {
    memberOf("org-1");

    await post();

    expect(policy.resolveTenantContext).toHaveBeenCalledWith(
      ORG,
      { userId: USER.id },
      "member",
    );
    expect(handler.handleMcpRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        scope: { orgSlug: ORG, organizationId: "org-1" },
      }),
    );
  });

  it("MCP2: hands the tool layer the user the token names", async () => {
    memberOf();

    await post();

    const grantArg = handler.handleMcpRequest.mock.calls[0]![1] as {
      session: { user: { id: string } };
    };
    expect(grantArg.session.user).toMatchObject({ id: USER.id });
  });
});

describe("rate limiting an organization's agent traffic", () => {
  beforeEach(() => {
    auth.auth.api.getMcpSession.mockResolvedValue(grant());
    memberOf();
  });

  it("MCP2: refuses once the window is spent", async () => {
    counter.setSpent(
      `${USER.id}:${ORG}`,
      "mcp.request",
      MAX_MCP_REQUESTS_PER_WINDOW,
    );

    const response = await post();

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32002 },
    });
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: counts each organization's traffic separately", async () => {
    await post();

    expect(counter.spent(`${USER.id}:${ORG}`, "mcp.request")).toBe(1);
    expect(counter.spent(`${USER.id}:rival`, "mcp.request")).toBe(0);
  });
});
