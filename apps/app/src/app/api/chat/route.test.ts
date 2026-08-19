import { AppError } from "@scibly/api/application-error";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatError } from "@/shared/ai/errors";

// Only the session, rate-limit table, and streamNotebookChat are doubled — the route's own
// middleware runs for real, so these tests exercise the actual auth/rate-limit/error-shaping order.

const counter = await vi.hoisted(async () =>
  (await import("@test/mocks/rate-limit-counter")).rateLimitCounter(),
);

const db = vi.hoisted(() => ({ rateLimit: counter.model }));

const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
const chat = vi.hoisted(() => ({ streamNotebookChat: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/auth/session", () => auth);
vi.mock("@/server/api/root", () => ({ createCaller: () => ({}) }));
vi.mock("@/features/notebook/chat/server/stream-chat", () => chat);

const { POST, MAX_CHAT_STREAMS_PER_WINDOW, chatStreamRateLimitKey } =
  await import("./route");

const AUTHOR = "user-author";
const ORG = "biology-dept";
const CORRELATION_ID = "corr-fixed-1";
const ROUTE_URL = "https://app.test/api/chat";

function signedIn(userId = AUTHOR) {
  auth.getSession.mockResolvedValue({ user: { id: userId } });
}

function request(body: unknown, correlationId = CORRELATION_ID) {
  return new NextRequest(ROUTE_URL, {
    method: "POST",
    headers: { "x-correlation-id": correlationId },
    body: JSON.stringify(body),
  });
}

const TURN = {
  orgSlug: ORG,
  notebookId: "nb-1",
  message: {
    id: "m-new",
    role: "user",
    parts: [{ type: "text", text: "outline a course on photosynthesis" }],
  },
};

function turn(overrides: Partial<typeof TURN> = {}) {
  return { ...TURN, ...overrides };
}

async function refusal(response: Response) {
  const body: unknown = await response.json();
  return { status: response.status, body };
}

function streamResponse() {
  return new Response("data: hello\n\n", {
    headers: { "content-type": "text/event-stream" },
  });
}

function windowKeys(): string[] {
  return counter.keys();
}

function spent(userId = AUTHOR, orgSlug = ORG): number {
  return counter.spent(chatStreamRateLimitKey(userId, orgSlug), "chat.stream");
}

function alreadySpent(count: number) {
  counter.setSpent(chatStreamRateLimitKey(AUTHOR, ORG), "chat.stream", count);
}

beforeEach(() => {
  vi.clearAllMocks();
  counter.clear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  signedIn();
  chat.streamNotebookChat.mockResolvedValue(streamResponse());
});

describe("who may open a stream", () => {
  it("a request with no signed-in user is refused before its body is read", async () => {
    auth.getSession.mockResolvedValue(null);
    const req = request(turn());
    const readBody = vi.spyOn(req, "json");

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(readBody).not.toHaveBeenCalled();
    expect(chat.streamNotebookChat).not.toHaveBeenCalled();
  });

  it("an unauthenticated request never reaches the counter", async () => {
    auth.getSession.mockResolvedValue(null);

    await POST(request(turn()));

    expect(windowKeys()).toEqual([]);
  });
});

describe("a body that does not validate", () => {
  const malformed: [string, unknown][] = [
    ["no organization named", { message: turn().message }],
    ["an organization that is not a string", { orgSlug: 42 }],
    [
      "a message with no parts",
      { orgSlug: ORG, message: { id: "m-new", role: "user" } },
    ],
    [
      "a message from neither the author nor the agent",
      {
        orgSlug: ORG,
        message: { id: "m-new", role: "system", parts: [] },
      },
    ],
  ];

  it.each(malformed)(
    "%s is refused before any notebook is resolved or created",
    async (_case, body) => {
      const response = await POST(request(body));

      expect(response.status).toBe(400);
      expect(chat.streamNotebookChat).not.toHaveBeenCalled();
    },
  );

  it("a request that does not validate costs nothing", async () => {
    await POST(request({ orgSlug: 42 }));

    expect(windowKeys()).toEqual([]);
  });

  it("the refusal names validation as the reason", async () => {
    const response = await POST(request({ orgSlug: 42 }));

    expect(await refusal(response)).toMatchObject({
      status: 400,
      body: { code: "request.validation_failed" },
    });
  });
});

describe("every response carries the correlation id it was handled under", () => {
  it("a stream carries it", async () => {
    const response = await POST(request(turn()));

    expect(response.headers.get("x-correlation-id")).toBe(CORRELATION_ID);
  });

  it("a refusal carries it in the header and in the body the client parses", async () => {
    const response = await POST(request({ orgSlug: 42 }));

    expect(response.headers.get("x-correlation-id")).toBe(CORRELATION_ID);
    expect(await response.json()).toMatchObject({
      correlationId: CORRELATION_ID,
    });
  });

  it("an unexpected failure carries it too - the one case an author reports", async () => {
    chat.streamNotebookChat.mockRejectedValue(new Error("prisma exploded"));

    const response = await POST(request(turn()));

    expect(response.status).toBe(500);
    expect(response.headers.get("x-correlation-id")).toBe(CORRELATION_ID);
    expect(await response.json()).toMatchObject({
      correlationId: CORRELATION_ID,
    });
  });

  it("a request that supplies no id is still handled under one", async () => {
    const req = new NextRequest(ROUTE_URL, {
      method: "POST",
      body: JSON.stringify(turn()),
    });

    const response = await POST(req);

    expect(response.headers.get("x-correlation-id")).toEqual(
      expect.stringMatching(/\S/),
    );
  });
});

describe("what a refusal about a notebook may say", () => {
  it("a notebook refusal reaches the author unchanged - no chat code is layered on", async () => {
    chat.streamNotebookChat.mockRejectedValue(
      new AppError({
        code: "NOT_FOUND",
        applicationCode: "api.not_found",
        message: "Notebook not found.",
      }),
    );

    expect(await refusal(await POST(request(turn())))).toEqual({
      status: 404,
      body: {
        code: "api.not_found",
        message: "Notebook not found.",
        correlationId: CORRELATION_ID,
      },
    });
  });

  it("an unexpected failure tells the author nothing about the notebook", async () => {
    chat.streamNotebookChat.mockRejectedValue(
      new Error("notebook nb-1 belongs to organization org-somebody-else"),
    );

    const { body } = await refusal(await POST(request(turn())));

    expect(body).toMatchObject({ code: "internal.unexpected" });
    expect(JSON.stringify(body)).not.toContain("org-somebody-else");
  });
});

describe("whose allowance a turn draws on", () => {
  it("every notebook an author owns in one organization draws on one allowance", async () => {
    await POST(request(turn({ notebookId: "nb-1" })));
    await POST(request(turn({ notebookId: "nb-2" })));
    await POST(request(turn({ notebookId: undefined })));

    expect(windowKeys()).toHaveLength(1);
    expect(spent()).toBe(3);
  });

  it("the same author's work in a second organization draws on its own", async () => {
    await POST(request(turn({ orgSlug: ORG })));
    await POST(request(turn({ orgSlug: "chemistry-dept" })));

    expect(spent(AUTHOR, ORG)).toBe(1);
    expect(spent(AUTHOR, "chemistry-dept")).toBe(1);
  });

  it("a colleague in the same organization has their own allowance", () => {
    expect(chatStreamRateLimitKey("user-colleague", ORG)).not.toBe(
      chatStreamRateLimitKey(AUTHOR, ORG),
    );
  });

  it("the turn is counted under the author and the organization it named", async () => {
    await POST(request(turn()));

    expect(windowKeys()).toEqual([
      expect.stringContaining(
        `${chatStreamRateLimitKey(AUTHOR, ORG)}|chat.stream|`,
      ),
    ]);
  });
});

describe("what counts against the allowance", () => {
  it("a dispatched turn counts once", async () => {
    await POST(request(turn()));

    expect(spent()).toBe(1);
  });

  it("a turn whose stream fails after dispatch still counts - the tokens are spent", async () => {
    chat.streamNotebookChat.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error("the model dropped the connection"));
          },
        }),
      ),
    );

    await POST(request(turn()));

    expect(spent()).toBe(1);
  });
});

describe("what a refused turn costs", () => {
  it("a turn refused for the notebook it named leaves the counter untouched", async () => {
    chat.streamNotebookChat.mockRejectedValue(
      new AppError({
        code: "NOT_FOUND",
        applicationCode: "api.not_found",
        message: "Notebook not found.",
      }),
    );

    await POST(request(turn()));

    expect(spent()).toBe(0);
  });

  it("a turn refused for the model it named leaves the counter untouched", async () => {
    chat.streamNotebookChat.mockRejectedValue(
      new ChatError("bad_request:model"),
    );

    await POST(request(turn()));

    expect(spent()).toBe(0);
  });

  it("the model refusal points the author at the selector rather than at an outage", async () => {
    chat.streamNotebookChat.mockRejectedValue(
      new ChatError("bad_request:model"),
    );

    expect(await refusal(await POST(request(turn())))).toMatchObject({
      status: 400,
      body: {
        code: "bad_request:model",
        message: expect.stringContaining("model"),
      },
    });
  });
});

describe("over the allowance", () => {
  beforeEach(() => {
    alreadySpent(MAX_CHAT_STREAMS_PER_WINDOW);
  });

  it("the turn is refused without a model call", async () => {
    await POST(request(turn()));

    expect(chat.streamNotebookChat).not.toHaveBeenCalled();
  });

  it("the author is told they hit the limit, not that something broke", async () => {
    expect(await refusal(await POST(request(turn())))).toMatchObject({
      status: 429,
      body: {
        code: "rate_limit:chat",
        message: expect.stringContaining("too quickly"),
      },
    });
  });

  it("being over the allowance does not move the counter further", async () => {
    await POST(request(turn()));

    expect(spent()).toBe(MAX_CHAT_STREAMS_PER_WINDOW);
  });

  it("the last turn inside the allowance still runs", async () => {
    alreadySpent(MAX_CHAT_STREAMS_PER_WINDOW - 1);

    const response = await POST(request(turn()));

    expect(response.status).toBe(200);
    expect(chat.streamNotebookChat).toHaveBeenCalledTimes(1);
  });
});

describe("a refused turn is not spent", () => {
  it("a request naming an organization that is not the author's costs nothing", async () => {
    chat.streamNotebookChat.mockRejectedValue(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "org.forbidden",
        message: "You do not have access to this organization.",
      }),
    );

    await POST(request(turn({ orgSlug: "somebody-elses-org" })));

    expect(spent(AUTHOR, "somebody-elses-org")).toBe(0);
  });
});
