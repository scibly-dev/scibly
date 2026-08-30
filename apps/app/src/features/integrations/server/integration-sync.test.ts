import { beforeEach, describe, expect, it, vi } from "vitest";

const sync = vi.hoisted(() => ({
  loadDueConnections: vi.fn(),
  pollConnection: vi.fn(),
  recordPollFailure: vi.fn(),
}));

vi.mock("./sync-source-freshness", () => sync);

const { INTEGRATION_POLL_EVENT, recordFailedPoll, requestDuePolls } =
  await import("./integration-sync");

const sendEvent = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  sync.loadDueConnections.mockResolvedValue([]);
});

describe("KC1: one run per due connection", () => {
  it("asks for a poll of every connection that is due", async () => {
    sync.loadDueConnections.mockResolvedValue([
      { id: "conn-a", provider: "NOTION" },
      { id: "conn-b", provider: "CONFLUENCE" },
    ]);

    expect(await requestDuePolls(sendEvent)).toEqual({ requested: 2 });
    expect(sendEvent).toHaveBeenCalledWith("request-polls", [
      {
        name: INTEGRATION_POLL_EVENT,
        data: { connectionId: "conn-a", provider: "NOTION" },
      },
      {
        name: INTEGRATION_POLL_EVENT,
        data: { connectionId: "conn-b", provider: "CONFLUENCE" },
      },
    ]);
  });

  it("sends nothing when nothing is due", async () => {
    expect(await requestDuePolls(sendEvent)).toEqual({ requested: 0 });
    expect(sendEvent).not.toHaveBeenCalled();
  });
});

describe("KF3/KF5: a poll that ran out of retries", () => {
  it("records the failure against the connection the run was for", async () => {
    await recordFailedPoll(
      { connectionId: "conn-broken", provider: "NOTION" },
      new Error("401 from provider"),
    );

    expect(sync.recordPollFailure).toHaveBeenCalledWith(
      "conn-broken",
      expect.any(Date),
    );
  });

  it("KF5: names the connection and its provider in the log", async () => {
    await recordFailedPoll(
      { connectionId: "conn-broken", provider: "NOTION" },
      new Error("401 from provider"),
    );

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("conn-broken"),
      expect.any(Error),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("NOTION"),
      expect.any(Error),
    );
  });

  it("refuses an event that names no connection rather than backing off a guess", async () => {
    await expect(
      recordFailedPoll({ provider: "NOTION" }, null),
    ).rejects.toThrow();

    expect(sync.recordPollFailure).not.toHaveBeenCalled();
  });
});
