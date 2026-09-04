import type { Principal } from "@scibly/auth/session";
import type * as DbModule from "@scibly/db";

import { createTestPrismaClient } from "@scibly/db/test-client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Opt in via MCP_INT_TEST_DATABASE_URL (docs/integration-tests.md).
const url = vi.hoisted(() => process.env.MCP_INT_TEST_DATABASE_URL ?? "");

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db: (await import("@scibly/db/test-client")).createTestPrismaClient(url),
}));

const { handleMcpRequest } = await import("./handler");
const { createTRPCContext } = await import("@scibly/api/trpc");
const { createCaller } = await import("@/server/api/root");

const RUN_ID = `int-mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `${RUN_ID}-org`;
const OTHER_ORG = `${RUN_ID}-other-org`;
const ACTOR = `${RUN_ID}-actor`;

const TITLE = "Spotting phishing";

describe.runIf(url !== "")("IT2 — an external agent building a course", () => {
  const db = createTestPrismaClient(url);

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: ACTOR,
        name: "Integration Actor",
        email: `${ACTOR}@int-test.local`,
      },
    });
    await db.organization.create({
      data: {
        id: ORG,
        name: "Integration Org",
        slug: ORG,
        createdAt: new Date(),
        members: {
          create: {
            id: `${RUN_ID}-member`,
            userId: ACTOR,
            role: "owner",
            createdAt: new Date(),
          },
        },
      },
    });
    await db.organization.create({
      data: {
        id: OTHER_ORG,
        name: "Someone Else",
        slug: OTHER_ORG,
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await db.course.deleteMany({ where: { organizationId: ORG } });
    await db.organization.deleteMany({
      where: { id: { in: [ORG, OTHER_ORG] } },
    });
    await db.user.delete({ where: { id: ACTOR } });
    await db.$disconnect();
  });

  async function rpc(name: string, args: Record<string, string>) {
    const session: Principal = {
      user: { id: ACTOR } as Principal["user"],
    };
    const headers = new Headers({
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    });

    const response = await handleMcpRequest(
      new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name, arguments: args },
        }),
      }),
      {
        session,
        caller: createCaller(
          await createTRPCContext({ headers, principal: session }),
        ),
      },
    );

    const text = await response.text();
    const frame = text.match(/^data: (.*)$/m);
    return JSON.parse(frame ? frame[1]! : text);
  }

  async function call(name: string, args: Record<string, string>) {
    const body = await rpc(name, args);
    expect(body.error, JSON.stringify(body)).toBeUndefined();
    return JSON.parse(body.result.content[0].text);
  }

  it("IT2: creates a course in the organization the agent names and reads it back", async () => {
    const created = await call("createCourse", { orgSlug: ORG, title: TITLE });

    const read = await call("getCourseById", { courseId: created.id });

    expect(read).toMatchObject({ id: created.id, title: TITLE });
    await expect(
      db.course.findUniqueOrThrow({ where: { id: created.id } }),
    ).resolves.toMatchObject({ organizationId: ORG, title: TITLE });
  });

  it("IT2: refuses an organization the actor is not a member of", async () => {
    const body = await rpc("createCourse", {
      orgSlug: OTHER_ORG,
      title: TITLE,
    });

    expect(body.result?.isError ?? body.error).toBeTruthy();
    await expect(
      db.course.count({ where: { organizationId: OTHER_ORG } }),
    ).resolves.toBe(0);
  });
});
