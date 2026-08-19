import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The ephemeral identity is module state that deliberately survives for the
 * page's lifetime, so each case starts from a freshly loaded module.
 */
async function loadResolver() {
  vi.resetModules();
  return import("./anonymous-identity");
}

function denyStorage(operations: ("read" | "write")[]) {
  const deny = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  if (operations.includes("read")) {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(deny);
  }
  if (operations.includes("write")) {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(deny);
  }
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("anonymous identity resolution", () => {
  it("mints and persists an identifier when storage is empty", async () => {
    const { resolveAnonymousId, ANONYMOUS_ID_KEY } = await loadResolver();

    const { id } = resolveAnonymousId();

    expect(id).not.toBe("");
    expect(window.localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it("returns the stored identifier without minting a replacement", async () => {
    const { resolveAnonymousId, ANONYMOUS_ID_KEY } = await loadResolver();
    window.localStorage.setItem(ANONYMOUS_ID_KEY, "learner-from-last-visit");

    expect(resolveAnonymousId().id).toBe("learner-from-last-visit");
    expect(window.localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(
      "learner-from-last-visit",
    );
  });

  it("returns a usable identifier when reading storage throws", async () => {
    const { resolveAnonymousId } = await loadResolver();
    denyStorage(["read", "write"]);

    expect(resolveAnonymousId().id).not.toBe("");
  });

  it("returns the same identifier on repeated calls when storage is unavailable", async () => {
    const { resolveAnonymousId } = await loadResolver();
    denyStorage(["read", "write"]);

    expect(resolveAnonymousId().id).toBe(resolveAnonymousId().id);
  });

  it("keeps one identifier when writing storage throws", async () => {
    const { resolveAnonymousId } = await loadResolver();
    denyStorage(["write"]);

    expect(resolveAnonymousId().id).toBe(resolveAnonymousId().id);
  });

  it("never throws when storage is unavailable", async () => {
    const { resolveAnonymousId } = await loadResolver();
    denyStorage(["read", "write"]);

    expect(() => resolveAnonymousId()).not.toThrow();
  });

  it("reports whether the identifier outlives the page", async () => {
    const fresh = await loadResolver();
    expect(fresh.resolveAnonymousId().persisted).toBe(true);

    window.localStorage.setItem(
      fresh.ANONYMOUS_ID_KEY,
      "learner-from-last-visit",
    );
    expect(fresh.resolveAnonymousId().persisted).toBe(true);

    const denied = await loadResolver();
    denyStorage(["read", "write"]);
    expect(denied.resolveAnonymousId().persisted).toBe(false);
    expect(denied.resolveAnonymousId().persisted).toBe(false);
  });

  it("a write that storage silently drops does not count as persisted", async () => {
    const { resolveAnonymousId } = await loadResolver();
    denyStorage(["write"]);

    expect(resolveAnonymousId().persisted).toBe(false);
  });
});
