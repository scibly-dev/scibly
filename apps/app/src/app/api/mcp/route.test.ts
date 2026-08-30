import type * as HandlerModule from "@/features/mcp/server/handler";

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

const handler = vi.hoisted(() => ({ handleMcpRequest: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/auth/config", () => auth);
vi.mock("@/server/api/root", () => ({ createCaller: vi.fn(() => ({})) }));
vi.mock("@/features/mcp/server/handler", async (importOriginal) => ({
  ...(await importOriginal<typeof HandlerModule>()),
  handleMcpRequest: handler.handleMcpRequest,
}));

const {
  POST,
  MAX_MCP_REQUESTS_PER_WINDOW,
  MAX_MCP_REQUESTS_PER_IP_PER_WINDOW,
} = await import("./route");

const USER = { id: "user-1", email: "author@acme.test" };
const ROUTE_URL = "https://app.scibly.com/api/mcp";
const CLIENT_IP = "203.0.113.7";

const HOUR = 60 * 60 * 1000;

function request() {
  return new Request(ROUTE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer tok-1",
      "x-forwarded-for": `${CLIENT_IP}, 10.0.0.1`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
}

function post() {
  return POST(request());
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

    expect((await post()).status).toBe(401);
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: refuses a token whose user has since been deleted", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(grant());
    db.user.findUnique.mockResolvedValue(null);

    expect((await post()).status).toBe(401);
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: reports a failed user lookup as a failure, not a refusal", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(grant());
    db.user.findUnique.mockRejectedValue(new Error("connection lost"));

    const response = await post();

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32603 },
    });
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });
});

describe("what the endpoint hands the tool layer", () => {
  beforeEach(() => auth.auth.api.getMcpSession.mockResolvedValue(grant()));

  it("MCP2: hands it the user the token names", async () => {
    await post();

    const grantArg = handler.handleMcpRequest.mock.calls[0]![1] as {
      session: { user: { id: string } };
    };
    expect(grantArg.session.user).toMatchObject({ id: USER.id });
  });

  it("MCP2: names no organization — the agent passes one per call", async () => {
    await post();

    expect(handler.handleMcpRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ scope: expect.anything() }),
    );
  });
});

describe("rate limiting an agent's traffic", () => {
  beforeEach(() => auth.auth.api.getMcpSession.mockResolvedValue(grant()));

  it("MCP2: refuses once the window is spent", async () => {
    counter.setSpent(USER.id, "mcp.request", MAX_MCP_REQUESTS_PER_WINDOW);

    const response = await post();

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32002 },
    });
    expect(handler.handleMcpRequest).not.toHaveBeenCalled();
  });

  it("MCP2: counts a user's traffic against one budget, not one per organization", async () => {
    await post();

    expect(counter.spent(USER.id, "mcp.request")).toBe(1);
  });

  it("MCP2: turns a flood away before it costs a token lookup", async () => {
    counter.setSpent(
      CLIENT_IP,
      "mcp.request.ip",
      MAX_MCP_REQUESTS_PER_IP_PER_WINDOW,
    );

    const response = await post();

    expect(response.status).toBe(429);
    // The point of the per-address limit: unauthenticated traffic is refused
    // without reading the token or the user behind it.
    expect(auth.auth.api.getMcpSession).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("MCP2: counts a refused request against the address that sent it", async () => {
    auth.auth.api.getMcpSession.mockResolvedValue(null);

    expect((await post()).status).toBe(401);
    expect(counter.spent(CLIENT_IP, "mcp.request.ip")).toBe(1);
  });
});
