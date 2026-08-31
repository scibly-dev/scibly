// @vitest-environment node
import type { Principal } from "@scibly/auth/session";
import type { TrpcCaller } from "@/server/api/root";

import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Runs the composed content path for real — handler, access policy, content
// query, headless writer, collab server — because the seam tests either side
// double their neighbours, so nothing else catches the halves failing to meet.

const COLLAB_PORT = vi.hoisted(() => {
  process.env.COLLAB_WS_URL = "ws://127.0.0.1:4572";
  return 4572;
});

const authorizeSceneEditorRoom = vi.hoisted(() => vi.fn());

vi.mock("@/features/course-authoring/access/server/policy", () => ({
  authorizeSceneEditorRoom,
  authorizeCourseMetadataRoom: vi.fn(),
  requireCourseEnrollment: vi.fn(),
}));

// The only thing keeping an agent out of another organization now that the
// endpoint names none, so it answers for real rather than always saying yes.
vi.mock("@/features/organizations/server", async (importOriginal) => {
  const { AppError } = await import("@scibly/api/application-error");
  return {
    ...(await importOriginal<object>()),
    requireOrgMember: vi.fn(async (organizationId: string) => {
      if (organizationId !== "org-1") {
        throw new AppError({
          code: "FORBIDDEN",
          applicationCode: "organization.access_denied",
          message: "You are not a member of this organization.",
        });
      }
      return { id: "m1", role: "admin" };
    }),
  };
});

vi.mock(
  "@/features/course-authoring/scenes/server/scene-lineage",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sceneLineageService: { getLineageForScene: async () => ["source-1"] },
  }),
);

/** The one `scene` row, serving the collab server and the access policy both. */
const row = vi.hoisted(() => ({
  documentState: null as Uint8Array | null,
  courseVersionId: null as string | null,
  organizationId: "org-1",
}));

vi.mock("@scibly/db", () => ({
  db: {
    scene: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        title: "Scene",
        courseVersionId: row.courseVersionId,
        documentState: row.documentState,
        lesson: {
          id: "lesson-1",
          courseId: "course-1",
          course: { id: "course-1", organizationId: row.organizationId },
        },
      }),
      updateMany: async ({ data }: { data: { documentState: Uint8Array } }) => {
        row.documentState = data.documentState;
        return { count: 1 };
      },
    },
  },
  toMemberRole: (role: string) => role,
}));

const { createCollabServer } = await import("@collab/server.js");
const { issueAuthorizedRoomToken } =
  await import("@/features/course-authoring/collaboration/server/issue-room-token");
const { awaitSynced } =
  await import("@/shared/content/editor/collaboration/provider-handshake");
const { handleMcpRequest } = await import("./handler");

const USER = { id: "user-1", name: "Ada", username: null };

let collab: ReturnType<typeof createCollabServer>;
let scenes = 0;
let scene = "";

beforeAll(async () => {
  collab = createCollabServer({ port: COLLAB_PORT });
  await collab.listen();
});

afterAll(async () => {
  await collab.destroy();
});

beforeEach(() => {
  authorizeSceneEditorRoom.mockResolvedValue({ access: "write" });
  row.documentState = null;
  row.courseVersionId = null;
  row.organizationId = "org-1";
  // A room per test: the server keeps documents in memory across a test file.
  scene = `scene_${++scenes}`;
});

type ToolOutput = { sceneId: string; html?: string; success?: boolean };

/** Calls a tool the way an external agent does, over the wire format. */
async function call(
  name: string,
  args: { html?: string; mode?: "replace" | "append" },
) {
  const request = new Request("https://app.scibly.com/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: { sceneId: scene, ...args } },
    }),
  });

  const response = await handleMcpRequest(request, {
    caller: {} as TrpcCaller,
    session: { user: USER as unknown as Principal["user"] },
  });

  const body = await response.text();
  const framed = body.match(/^data: (.*)$/m);
  const { result } = JSON.parse(framed ? framed[1]! : body);
  const text: string = result.content[0].text;
  return result.isError
    ? { error: text }
    : { output: JSON.parse(text) as ToolOutput };
}

/** A second author with the scene open, connected the way the editor connects. */
async function openAsAuthor() {
  const provider = new HocuspocusProvider({
    name: scene,
    url: `ws://127.0.0.1:${COLLAB_PORT}`,
    token: () =>
      issueAuthorizedRoomToken({
        room: scene,
        kind: "scene-author",
        user: USER,
      }),
  });
  await awaitSynced(provider, scene, 5000);
  return provider;
}

describe("an external agent working on a draft scene", () => {
  it("writes content, and reads back exactly what it can write again", async () => {
    const author = await openAsAuthor();

    expect(
      await call("insertContent", { html: "<h2>Outline</h2><p>Hi</p>" }),
    ).toEqual({ output: { sceneId: scene, success: true } });

    const read = await call("getSceneContent", {});
    // No sourceIds: an external agent cannot write lineage back, and scenes it
    // writes carry none (docs/adr/0005-external-scenes-carry-no-lineage.md).
    expect(read.output).toEqual({
      sceneId: scene,
      html: '<h2>Outline</h2><p style="display: block;">Hi</p>',
    });

    // The write reached the author's own copy, which is the point of going
    // through the room rather than the row.
    expect(author.document.getXmlFragment("default").toString()).toBe(
      '<heading level="2">Outline</heading><paragraph>Hi</paragraph>',
    );
    author.destroy();
  });

  it("appends to what it read without losing it", async () => {
    await call("insertContent", { html: "<p>First</p>" });
    await call("insertContent", { html: "<p>Second</p>", mode: "append" });

    const read = await call("getSceneContent", {});

    expect(read.output?.html).toBe(
      '<p style="display: block;">First</p><p style="display: block;">Second</p>',
    );
  });

  it("is refused HTML the editor schema would not accept, by name", async () => {
    const refused = await call("insertContent", {
      html: '<div data-type="quiz"><p>Pick one</p></div>',
    });

    expect(refused.error).toContain("quiz");
    expect(await call("getSceneContent", {})).toEqual({
      output: { sceneId: scene, html: "" },
    });
  });
});

describe("scenes an external agent must not reach", () => {
  it("refuses to write to a published scene, but still reads it", async () => {
    row.courseVersionId = "version-1";
    row.documentState = new TextEncoder().encode("<p>Frozen</p>");

    expect((await call("insertContent", { html: "<p>x</p>" })).error).toContain(
      "published",
    );
    // A published scene has no room behind it: the row is the frozen copy, and
    // reading it is what an agent may do with it, as in the app.
    expect((await call("getSceneContent", {})).output).toEqual({
      sceneId: scene,
      html: "<p>Frozen</p>",
    });
  });

  it("refuses a scene in an organization the author is not a member of", async () => {
    row.organizationId = "org-2";

    expect((await call("getSceneContent", {})).error).toContain("not a member");
    expect((await call("insertContent", { html: "<p>x</p>" })).error).toContain(
      "not a member",
    );
  });
});
