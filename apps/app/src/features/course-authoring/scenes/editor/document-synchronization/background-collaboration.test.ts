import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

// Exercises the background insertion/read paths with a real editor; only the network calls are doubled.

type ProviderEventPayload = {
  reason?: string;
  event?: { reason?: string; code?: number };
  number?: number;
};

type Listener = (payload: ProviderEventPayload) => void;

class FakeProvider {
  document = new Y.Doc();
  awareness = null;
  isSynced = false;
  hasUnsyncedChanges = false;
  destroyed = false;
  attached = false;

  private listeners = new Map<string, Set<Listener>>();

  constructor() {
    this.document.on("update", () => {
      this.hasUnsyncedChanges = true;
    });
  }

  attach() {
    this.attached = true;
  }

  on(event: string, handler: Listener) {
    const handlers = this.listeners.get(event) ?? new Set<Listener>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  off(event: string, handler: Listener) {
    this.listeners.get(event)?.delete(handler);
    return this;
  }

  destroy() {
    this.destroyed = true;
  }

  emit(event: string, payload: ProviderEventPayload) {
    for (const handler of [...(this.listeners.get(event) ?? [])]) {
      handler(payload);
    }
  }

  sync() {
    this.isSynced = true;
    this.emit("synced", {});
  }

  acknowledge() {
    this.hasUnsyncedChanges = false;
    this.emit("unsyncedChanges", { number: 0 });
  }

  close(reason = "network down", code = 1006) {
    this.emit("close", { event: { reason, code } });
  }

  listenerCount(event: string) {
    return this.listeners.get(event)?.size ?? 0;
  }
}

type RoomConfig = {
  name: string;
  token: string | (() => Promise<string>) | null;
  websocketProvider: unknown;
};

const { createSessionAwareRoomProvider, issueRoomToken } = vi.hoisted(() => ({
  createSessionAwareRoomProvider: vi.fn<(config: RoomConfig) => unknown>(),
  issueRoomToken: vi.fn(),
}));

vi.mock("@/shared/content/editor/collaboration/create-room-provider", () => ({
  createSessionAwareRoomProvider,
}));

vi.mock("@/shared/api/trpc/client", () => ({
  vanillaApi: { collab: { issueRoomToken: { mutate: issueRoomToken } } },
}));

const { performBackgroundInsertion, performBackgroundRead } =
  await import("./background-collaboration");

const SCENE_ID = "scene_1";
const CLEAN_HTML =
  '<div data-type="custom-guide-character"><p>Ready to start?</p></div>';

let provider: FakeProvider;

function insert(html = CLEAN_HTML) {
  return performBackgroundInsertion({
    sceneId: SCENE_ID,
    html,
    websocketProvider: {},
    token: "room-token",
  });
}

async function settle() {
  await vi.advanceTimersByTimeAsync(0);
}

function track<T>(promise: Promise<T>) {
  const state = { settled: false, value: undefined as T | undefined };
  void promise.then((value) => {
    state.settled = true;
    state.value = value;
  });
  return state;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  provider = new FakeProvider();
  createSessionAwareRoomProvider.mockImplementation(() => provider);
  issueRoomToken.mockResolvedValue({ token: "minted-token" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DD4 — nothing is written before the document has loaded", () => {
  it("DD4: the write waits for the handshake rather than replacing an empty document", async () => {
    const result = track(insert());
    await settle();

    expect(provider.document.getXmlFragment("default").length).toBe(0);
    expect(result.settled).toBe(false);

    provider.sync();
    await settle();
    provider.acknowledge();
    await settle();

    expect(result.value).toEqual({ success: true });
    expect(provider.document.getXmlFragment("default").length).toBeGreaterThan(
      0,
    );
  });

  it("DD4: a provider that is already synced is written to without waiting", async () => {
    provider.isSynced = true;

    const result = track(insert());
    await settle();
    provider.acknowledge();
    await settle();

    expect(result.value).toEqual({ success: true });
  });

  it("DD4: a handshake that never completes fails the write and writes nothing", async () => {
    const result = track(insert());

    await vi.advanceTimersByTimeAsync(5000);

    expect(result.value?.success).toBe(false);
    expect(result.value?.error).toContain("timed out");
    expect(provider.document.getXmlFragment("default").length).toBe(0);
  });

  it("DD4: a connection refused during the handshake fails the write", async () => {
    const result = track(insert());
    await settle();

    provider.emit("authenticationFailed", { reason: "forbidden" });
    await settle();

    expect(result.value?.success).toBe(false);
    expect(result.value?.error).toContain("forbidden");
    expect(provider.document.getXmlFragment("default").length).toBe(0);
  });
});

describe("DD1/DD2/DD3 — success means the author received it", () => {
  it("DD1: the write is not reported successful while the update is unacknowledged", async () => {
    const result = track(insert());
    await settle();
    provider.sync();
    await settle();

    expect(provider.hasUnsyncedChanges).toBe(true);
    expect(result.settled).toBe(false);

    provider.acknowledge();
    await settle();

    expect(result.value).toEqual({ success: true });
  });

  it("DD1: the connection is not torn down while the update is still unacknowledged", async () => {
    track(insert());
    await settle();
    provider.sync();
    await settle();

    expect(provider.destroyed).toBe(false);

    provider.acknowledge();
    await settle();

    expect(provider.destroyed).toBe(true);
  });

  it("DD2: an update that is never acknowledged is reported as a failed write", async () => {
    const result = track(insert());
    await settle();
    provider.sync();
    await settle();

    await vi.advanceTimersByTimeAsync(10000);

    expect(result.value?.success).toBe(false);
    expect(result.value?.error).toContain("not acknowledged");
  });

  it("DD3: a connection that closes after the write but before the acknowledgement fails it", async () => {
    const result = track(insert());
    await settle();
    provider.sync();
    await settle();

    provider.close("server restarted", 1001);
    await settle();

    expect(result.value?.success).toBe(false);
    expect(result.value?.error).toContain("server restarted");
  });

  it("DD1: a read has nothing to deliver and does not wait for an acknowledgement", async () => {
    const result = track(
      performBackgroundRead({
        sceneId: SCENE_ID,
        websocketProvider: {},
        token: "room-token",
      }),
    );
    await settle();
    provider.sync();
    await settle();

    expect(result.settled).toBe(true);
    expect(result.value?.error).toBeUndefined();
  });

  it("DR1: a read that never reaches the document reports no content at all", async () => {
    const result = track(
      performBackgroundRead({
        sceneId: SCENE_ID,
        websocketProvider: {},
        token: "room-token",
      }),
    );

    await vi.advanceTimersByTimeAsync(5000);

    expect(result.value).toBeDefined();
    expect(result.value && "html" in result.value).toBe(false);
    expect(result.value?.error).toContain("timed out");
  });

  it("DD1/DD3: no listeners are left on the provider once the write settles", async () => {
    track(insert());
    await settle();
    provider.sync();
    await settle();
    provider.acknowledge();
    await settle();

    expect(provider.listenerCount("close")).toBe(0);
    expect(provider.listenerCount("unsyncedChanges")).toBe(0);
    expect(provider.listenerCount("synced")).toBe(0);
  });
});

describe("DW3/DT4 — the background path is not a way around the rules", () => {
  it("DW3: content the schema cannot represent is refused before the document is touched", async () => {
    const result = track(insert('<div data-type="quiz"><p>Pick one</p></div>'));
    await settle();
    provider.sync();
    await settle();

    expect(result.value?.success).toBe(false);
    expect(result.value?.error).toContain("quiz");
    expect(provider.document.getXmlFragment("default").length).toBe(0);
  });

  it("DT4: the connection asks for a capability scoped to the scene being written", async () => {
    const result = track(
      performBackgroundInsertion({
        sceneId: SCENE_ID,
        html: CLEAN_HTML,
        websocketProvider: {},
      }),
    );
    await settle();
    provider.sync();
    await settle();
    provider.acknowledge();
    await settle();

    expect(result.value).toEqual({ success: true });

    const [config] = createSessionAwareRoomProvider.mock.calls[0];
    expect(config.name).toBe(SCENE_ID);
    if (typeof config.token !== "function") {
      throw new Error("Expected the room token to be minted on demand");
    }
    await config.token();
    expect(issueRoomToken).toHaveBeenCalledWith({
      room: SCENE_ID,
      kind: "scene-author",
    });
  });
});
