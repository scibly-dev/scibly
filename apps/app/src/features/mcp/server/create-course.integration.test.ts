import type { Principal } from "@scibly/auth/session";
import type * as DbModule from "@scibly/db";

import { createTestPrismaClient } from "@scibly/db/test-client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Runs against real Postgres through the real tRPC procedures, unlike MCP1/MCP3's mocked caller — no mock can prove an agent's write lands in the endpoint's organization. Opt in via MCP_INT_TEST_DATABASE_URL (docs/integration-tests.md).
const url = vi.hoisted(() => process.env.MCP_INT_TEST_DATABASE_URL ?? "");

// The procedures behind the tools read the app's singleton client, pinned to a
// fake URL in the test setup — point it at the disposable database instead.
vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db: (await import("@scibly/db/test-client")).createTestPrismaClient(url),
}));

const { handleMcpRequest } = await import("./handler");
const { createTRPCContext } = await import("@scibly/api/trpc");
const { createCaller } = await import("@/server/api/root");

const RUN_ID = `int-mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `${RUN_ID}-org`;
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
  });

  afterAll(async () => {
    await db.course.deleteMany({ where: { organizationId: ORG } });
    await db.organization.delete({ where: { id: ORG } });
    await db.user.delete({ where: { id: ACTOR } });
    await db.$disconnect();
  });

  async function call(name: string, args: Record<string, string>) {
    const session: Principal = {
      user: { id: ACTOR } as Principal["user"],
    };
    const headers = new Headers({
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    });

    const response = await handleMcpRequest(
      new Request(`https://app.scibly.com/api/org/${ORG}/mcp`, {
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
        scope: { orgSlug: ORG, organizationId: ORG },
        caller: createCaller(
          await createTRPCContext({ headers, principal: session }),
        ),
      },
    );

    const text = await response.text();
    const frame = text.match(/^data: (.*)$/m);
    const body = JSON.parse(frame ? frame[1]! : text);
    expect(body.error, text).toBeUndefined();
    return JSON.parse(body.result.content[0].text);
  }

  it("IT2: creates a course in the endpoint's organization and reads it back", async () => {
    const created = await call("createCourse", { title: TITLE });

    const read = await call("getCourseById", { courseId: created.id });

    expect(read).toMatchObject({ id: created.id, title: TITLE });
    await expect(
      db.course.findUniqueOrThrow({ where: { id: created.id } }),
    ).resolves.toMatchObject({ organizationId: ORG, title: TITLE });
  });
});
