import type { Principal } from "@scibly/auth/session";
import type { TrpcCaller } from "@/server/api/root";

import { describe, expect, it, vi } from "vitest";

import { handleMcpRequest, jsonRpcError, mcpUnauthorized } from "./handler";
import { MCP_TOOL_NAMES } from "./tool-surface";

const SCOPE = { orgSlug: "acme", organizationId: "org-1" };

const COURSES = { items: [{ id: "course-1", title: "Spotting phishing" }] };

function fakeCaller(list = vi.fn(async () => COURSES)) {
  const getById = vi.fn(async () => COURSES.items[0]);
  return {
    caller: { course: { list, getById } } as unknown as TrpcCaller,
    list,
    getById,
  };
}

async function post(body: unknown, caller: TrpcCaller) {
  const request = new Request("https://app.scibly.com/api/org/acme/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });

  const response = await handleMcpRequest(request, {
    caller,
    scope: SCOPE,
    session: { user: { id: "user-1" } as Principal["user"] },
  });

  return { response, body: await readRpc(response) };
}

/** A 2025-era exchange comes back as one SSE frame; a modern one as plain JSON. */
async function readRpc(response: Response) {
  const text = await response.text();
  const frame = text.match(/^data: (.*)$/m);
  return JSON.parse(frame ? frame[1]! : text);
}

const rpc = (method: string, params?: unknown) => ({
  jsonrpc: "2.0",
  id: 1,
  method,
  params,
});

describe("the tool surface an external agent sees", () => {
  // Spelled out rather than compared to MCP_TOOL_NAMES: a test that reads the
  // allow-list cannot notice the allow-list is missing a tool.
  const EXPECTED_SURFACE = [
    "getAvailableMembers",
    "getCourseById",
    "getCourseStats",
    "getDashboardStats",
    "getEditorSchema",
    "getOrganization",
    "listCourses",
    "listEnrolledCourses",
    "listEnrollments",
    "listInvitations",
    "listLessons",
    "listMembers",
    "listScenes",
    "loadSkill",
  ];

  it("MCP1: offers exactly the read tools, and nothing that mutates", async () => {
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    expect(
      body.result.tools.map((tool: { name: string }) => tool.name).sort(),
    ).toEqual(EXPECTED_SURFACE);
    expect([...MCP_TOOL_NAMES].sort()).toEqual(EXPECTED_SURFACE);
  });

  it("MCP1: never lets an agent name the organization it is acting in", async () => {
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    const named = body.result.tools.flatMap((tool: { inputSchema: object }) =>
      Object.keys(
        (tool.inputSchema as { properties?: object }).properties ?? {},
      ),
    );

    expect(named).not.toContain("orgSlug");
    expect(named).not.toContain("slug");
    expect(named).not.toContain("organizationId");
  });
});

describe("calling a tool over MCP", () => {
  it("MCP1: answers with the organization's real data, scoped to the endpoint's org", async () => {
    const { caller, list } = fakeCaller();

    const { body } = await post(
      rpc("tools/call", { name: "listCourses", arguments: { limit: 6 } }),
      caller,
    );

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ orgSlug: "acme", limit: 6 }),
    );
    expect(JSON.parse(body.result.content[0].text)).toEqual(COURSES);
  });

  it("MCP1: overrides an organization the agent names for itself", async () => {
    const { caller, list } = fakeCaller();

    await post(
      rpc("tools/call", {
        name: "listCourses",
        arguments: { limit: 6, orgSlug: "rival" },
      }),
      caller,
    );

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ orgSlug: "acme" }),
    );
  });

  it("MCP1: passes a resource id to the procedure that authorizes it", async () => {
    const { caller, getById } = fakeCaller();

    await post(
      rpc("tools/call", {
        name: "getCourseById",
        arguments: { courseId: "course-1" },
      }),
      caller,
    );

    expect(getById).toHaveBeenCalledWith({ courseId: "course-1" });
  });

  it("MCP1: does not expose a tool that was left off the surface", async () => {
    const { body } = await post(
      rpc("tools/call", { name: "deleteCourse", arguments: { courseId: "c" } }),
      fakeCaller().caller,
    );

    expect(body.error).toBeDefined();
  });
});

describe("refusing a request that never gets as far as a tool", () => {
  const request = new Request("https://app.scibly.com/api/org/acme/mcp", {
    method: "POST",
  });

  it("MCP1: tells an agent with no token where to go and get one", () => {
    const response = mcpUnauthorized(request);

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Bearer resource_metadata="https://app.scibly.com/.well-known/oauth-protected-resource"',
    );
  });

  it("MCP1: shapes every refusal as a JSON-RPC error object", async () => {
    const response = jsonRpcError(-32001, "Forbidden", { status: 403 });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32001 },
    });
  });
});
