// @vitest-environment node
import type { AddressInfo } from "node:net";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { encodeHtmlBytes } from "@scibly/lib";
import {
  prosemirrorToYXmlFragment,
  yXmlFragmentToProsemirror,
} from "@tiptap/y-tiptap";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as Y from "yjs";

import {
  awaitDelivered,
  awaitSynced,
} from "@/shared/content/editor/collaboration/provider-handshake";

// Runs against the real collab server booted in process — merge correctness is
// unobservable anywhere else — doubling only the room policy and the scene
// table, which have their own tests.

const authorizeSceneEditorRoom = vi.hoisted(() => vi.fn());

vi.mock("@/features/course-authoring/access/server/policy", () => ({
  authorizeSceneEditorRoom,
  authorizeCourseMetadataRoom: vi.fn(),
}));

/** The `scene` rows the collab server loads from and flushes back to. */
const scenes = vi.hoisted(() => new Map<string, Uint8Array>());

vi.mock("@scibly/db", () => ({
  db: {
    scene: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const documentState = scenes.get(where.id);
        return documentState ? { documentState } : null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { documentState: Uint8Array };
      }) => {
        scenes.set(where.id, data.documentState);
        return { count: 1 };
      },
    },
  },
}));

const { createCollabServer } = await import("@collab/server.js");
const { issueAuthorizedRoomToken } =
  await import("@/features/course-authoring/collaboration/server/issue-room-token");
const { parseSceneHtml, sceneSchema } = await import("./scene-html");
const { readSceneHtml, writeSceneHtml } = await import("./scene-document");

const AUTHOR = { id: "user_1", name: "Ada", username: null };
const AGENT_HTML = "<p>Written by the agent</p>";

let collab: ReturnType<typeof createCollabServer>;
let url: string;
let rooms = 0;

beforeAll(async () => {
  collab = createCollabServer({ port: 0 });
  await collab.listen();
  url = `ws://127.0.0.1:${(collab.address as AddressInfo).port}`;
});

afterAll(async () => {
  await collab.destroy();
});

beforeEach(() => {
  vi.clearAllMocks();
  scenes.clear();
  authorizeSceneEditorRoom.mockResolvedValue({ access: "write" });
});

/** A room per test: the server keeps documents in memory across a test file. */
function newRoom() {
  return `scene_${++rooms}`;
}

/** A second author with the scene open, connected the way the editor connects. */
async function openAsAuthor(room: string) {
  const provider = new HocuspocusProvider({
    name: room,
    url,
    token: () =>
      issueAuthorizedRoomToken({ room, kind: "scene-author", user: AUTHOR }),
  });
  await awaitSynced(provider, room, 5000);
  return provider;
}

/** Writes into the author's own copy, as typing in the editor would. */
async function type(provider: HocuspocusProvider, room: string, html: string) {
  const fragment = provider.document.getXmlFragment("default");
  provider.document.transact(() =>
    prosemirrorToYXmlFragment(parseSceneHtml(html), fragment),
  );
  await awaitDelivered(provider, room, 5000);
}

function text(document: Y.Doc) {
  const node = yXmlFragmentToProsemirror(
    sceneSchema(),
    document.getXmlFragment("default"),
  );
  return node.textBetween(0, node.content.size, " ");
}

/** The scene row's content, as the next reader of that row would see it. */
async function persistedText(room: string) {
  const document = new Y.Doc();
  await vi.waitFor(() => expect(scenes.has(room)).toBe(true), {
    timeout: 5000,
  });
  Y.applyUpdate(document, scenes.get(room)!);
  return text(document);
}

/** Waits for the next change to reach this client rather than sleeping. */
function nextUpdate(document: Y.Doc, timeoutMs = 5000) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      document.off("update", settle);
      reject(new Error("update never arrived"));
    }, timeoutMs);
    function settle() {
      clearTimeout(timer);
      document.off("update", settle);
      resolve();
    }
    document.on("update", settle);
  });
}

describe("a server-side caller authenticating without a browser session", () => {
  it("writes the HTML into the scene's author document", async () => {
    const room = newRoom();

    const result = await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      user: AUTHOR,
      url,
    });
    expect(result).toEqual({ success: true });

    // All the way through: the server accepted the token, merged the write and
    // flushed it back to the scene row it would load from next time.
    await expect(persistedText(room)).resolves.toBe("Written by the agent");
  });

  it("is refused exactly where a browser would be, and writes nothing", async () => {
    const room = newRoom();
    authorizeSceneEditorRoom.mockRejectedValue(new Error("Scene not found."));

    const result = await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      user: AUTHOR,
      url,
      timeoutMs: 2000,
    });

    // Not `refused`: the content was never the problem, so the caller reports
    // this as a failed write rather than as content the author must fix.
    expect(result).toEqual({
      success: false,
      error: "Scene not found.",
      refused: false,
    });
    expect(scenes.has(room)).toBe(false);
  });

  it("refuses to write with no author to act for", async () => {
    const room = newRoom();

    const result = await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      url,
      timeoutMs: 2000,
    });

    expect(result.success).toBe(false);
    expect(authorizeSceneEditorRoom).not.toHaveBeenCalled();
    expect(scenes.has(room)).toBe(false);
  });

  // The server, not the writer, refuses, so the writer learns of it by the
  // delivery timeout expiring rather than by a message naming access.
  it("is refused a room the author was only granted read access to", async () => {
    const room = newRoom();
    authorizeSceneEditorRoom.mockResolvedValue({ access: "read" });

    const result = await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      user: AUTHOR,
      url,
      deliveryTimeoutMs: 2000,
    });

    expect(result.success).toBe(false);
    expect(scenes.has(room)).toBe(false);
  });
});

describe("writing while an author holds the same document open", () => {
  it("loses neither side's content", async () => {
    const room = newRoom();
    const author = await openAsAuthor(room);
    await type(author, room, "<p>The author was here</p>");
    const arrived = nextUpdate(author.document);

    const result = await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      mode: "append",
      user: AUTHOR,
      url,
    });
    expect(result).toEqual({ success: true });

    await arrived;
    expect(text(author.document)).toBe(
      "The author was here Written by the agent",
    );
    author.destroy();
  });

  it("replaces, by default, everything that was there", async () => {
    const room = newRoom();
    const author = await openAsAuthor(room);
    await type(author, room, "<p>The author was here</p>");
    const arrived = nextUpdate(author.document);

    // The destructive default: an agent that means to keep the scene has to
    // read it first and write the whole thing back.
    await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      user: AUTHOR,
      url,
    });

    await arrived;
    expect(text(author.document)).toBe("Written by the agent");
    author.destroy();
  });

  it("leaves the author's later edits intact", async () => {
    const room = newRoom();
    const author = await openAsAuthor(room);
    const arrived = nextUpdate(author.document);

    await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      user: AUTHOR,
      url,
    });
    await arrived;
    await type(author, room, "<p>Second thoughts</p>");

    const reader = await openAsAuthor(room);
    expect(text(reader.document)).toBe("Second thoughts");
    author.destroy();
    reader.destroy();
  });
});

describe("content the editor schema would not accept", () => {
  it("is rejected before the document is touched", async () => {
    const room = newRoom();
    const author = await openAsAuthor(room);

    const result = await writeSceneHtml({
      sceneId: room,
      html: '<div data-type="quiz"><p>Pick one</p></div>',
      user: AUTHOR,
      url,
    });

    expect(result).toHaveProperty("error", expect.stringContaining("quiz"));
    expect(text(author.document)).toBe("");
    author.destroy();
  });
});

describe("a scene last saved before collaborative editing", () => {
  it("keeps the content the agent did not write", async () => {
    const room = newRoom();
    scenes.set(room, encodeHtmlBytes("<p>Written years ago</p>"));
    const author = await openAsAuthor(room);
    const arrived = nextUpdate(author.document);

    const result = await writeSceneHtml({
      sceneId: room,
      html: AGENT_HTML,
      mode: "append",
      user: AUTHOR,
      url,
    });
    expect(result).toEqual({ success: true });

    await arrived;
    expect(text(author.document)).toBe(
      "Written years ago Written by the agent",
    );
    author.destroy();
  });
});

describe("reading a scene the author has open", () => {
  it("returns what they typed, before any of it reached the row", async () => {
    const room = newRoom();
    const author = await openAsAuthor(room);
    await type(author, room, "<p>Not saved yet</p>");

    const result = await readSceneHtml({ sceneId: room, user: AUTHOR, url });

    // Serialized by the editor's own schema, styles and all.
    expect(result).toEqual({
      success: true,
      html: '<p style="display: block;">Not saved yet</p>',
    });
    expect(parseSceneHtml(result.success ? result.html : "")).toBeTruthy();
    author.destroy();
  });

  it("reads a scene last saved before collaborative editing", async () => {
    const room = newRoom();
    scenes.set(room, encodeHtmlBytes("<p>Written years ago</p>"));

    const result = await readSceneHtml({ sceneId: room, user: AUTHOR, url });

    expect(result).toEqual({ success: true, html: "<p>Written years ago</p>" });
  });
});
