// @vitest-environment node
import type { McpServer } from "@modelcontextprotocol/server";

import {
  CLIENT_CAPABILITIES_META_KEY,
  isInputRequiredResult,
} from "@modelcontextprotocol/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  approval,
  type ApprovalRefusals,
  approvalToken,
  registerApprovedTool,
} from "./approval";

const REFUSALS: ApprovalRefusals = {
  cancelled: "no answer",
  declined: "declined",
  mismatched: "wrong items",
};

const TOKEN = approvalToken("deleteScenes", "course-1", ["a", "b"]);

function ctx(answer?: {
  action: string;
  content?: unknown;
  requestState?: string;
}) {
  return {
    mcpReq: {
      envelope: { [CLIENT_CAPABILITIES_META_KEY]: { elicitation: {} } },
      inputResponses: answer
        ? { confirm: { action: answer.action, content: answer.content } }
        : undefined,
      requestState: () => answer?.requestState,
    },
  } as never;
}

/** A 2025-era client: no capability envelope reaches the handler at all. */
const LEGACY = {
  mcpReq: { inputResponses: undefined, requestState: () => undefined },
} as never;

function ask(answer?: Parameters<typeof ctx>[0]) {
  return approval(ctx(answer), {
    token: TOKEN,
    message: "Delete two scenes?",
    refusals: REFUSALS,
  });
}

function askLegacy(confirmationToken?: string) {
  return approval(LEGACY, {
    token: TOKEN,
    message: "Delete two scenes?",
    refusals: REFUSALS,
    confirmationToken,
  });
}

function refusal(result: ReturnType<typeof ask>) {
  const content = (result as { content?: { text: string }[] }).content;
  return JSON.parse(content![0]!.text) as {
    success: boolean;
    message: string;
    needsConfirmation?: boolean;
    confirmationToken?: string;
  };
}

describe("the approval gate", () => {
  it("A1: asks on the first round, carrying what the author reads and what it binds to", () => {
    const result = ask();

    expect(isInputRequiredResult(result)).toBe(true);
    expect(result).toMatchObject({
      requestState: TOKEN,
      inputRequests: { confirm: { params: { message: "Delete two scenes?" } } },
    });
  });

  it("A2: lets the caller through only on a ticked box against the state it issued", () => {
    expect(
      ask({
        action: "accept",
        content: { confirm: true },
        requestState: TOKEN,
      }),
    ).toBeNull();
  });

  it("A3: an approval for one set of items does not authorize another", () => {
    const result = ask({
      action: "accept",
      content: { confirm: true },
      requestState: approvalToken("deleteScenes", "course-1", ["c"]),
    });

    expect(refusal(result)).toEqual({
      success: false,
      message: REFUSALS.mismatched,
    });
  });

  it("A3: nor does one with no state echoed back at all", () => {
    const result = ask({ action: "accept", content: { confirm: true } });

    expect(refusal(result).message).toBe(REFUSALS.mismatched);
  });

  it("A4: an accepted form with the box left unticked is still a no", () => {
    const result = ask({
      action: "accept",
      content: { confirm: false },
      requestState: TOKEN,
    });

    expect(refusal(result).message).toBe(REFUSALS.declined);
  });

  it("A4: so is an accepted form that answered nothing", () => {
    const result = ask({ action: "accept", requestState: TOKEN });

    expect(refusal(result).message).toBe(REFUSALS.declined);
  });

  it("A4: an explicit decline is a no", () => {
    const result = ask({ action: "decline", requestState: TOKEN });

    expect(refusal(result).message).toBe(REFUSALS.declined);
  });

  it("A5: a dismissed dialog is unanswered, not declined — the author never saw the question through", () => {
    const result = ask({ action: "cancel", requestState: TOKEN });

    expect(refusal(result).message).toBe(REFUSALS.cancelled);
  });
});

describe("the approval gate on a client that cannot be elicited", () => {
  it("A8: hands back the same summary and the token that opens it, having done nothing", () => {
    const answer = refusal(askLegacy());

    expect(answer.success).toBe(false);
    expect(answer.needsConfirmation).toBe(true);
    expect(answer.confirmationToken).toBe(TOKEN);
    expect(answer.message).toContain("Delete two scenes?");
  });

  it("A8: lets the second call through on the token it issued", () => {
    expect(askLegacy(TOKEN)).toBeNull();
  });

  it("A9: a token minted for another set of items does not open this one", () => {
    const result = askLegacy(approvalToken("deleteScenes", "course-1", ["c"]));

    expect(refusal(result).message).toBe(REFUSALS.mismatched);
  });

  it("A9: nor does an empty one, which is a token echoed back wrong rather than absent", () => {
    expect(refusal(askLegacy("")).message).toBe(REFUSALS.mismatched);
  });

  it("A10: a client that can elicit is still elicited, token or no token", () => {
    const result = approval(ctx(), {
      token: TOKEN,
      message: "Delete two scenes?",
      refusals: REFUSALS,
      confirmationToken: TOKEN,
    });

    expect(isInputRequiredResult(result)).toBe(true);
  });
});

describe("approvalToken", () => {
  it("A6: does not care what order the caller listed the items in", () => {
    expect(approvalToken("deleteScenes", "course-1", ["b", "a"])).toBe(TOKEN);
  });

  it("A6: tells apart the tool, the course and the items", () => {
    expect(approvalToken("deleteLessons", "course-1", ["a", "b"])).not.toBe(
      TOKEN,
    );
    expect(approvalToken("deleteScenes", "course-2", ["a", "b"])).not.toBe(
      TOKEN,
    );
    expect(approvalToken("deleteScenes", "course-1", ["a"])).not.toBe(TOKEN);
  });

  it("A7: cannot be re-cut, so an id that looks like a separator is not two items", () => {
    expect(approvalToken("deleteScenes", "course-1", ['a","b'])).not.toBe(
      TOKEN,
    );
  });
});

describe("registerApprovedTool", () => {
  type Registered = {
    description: string;
    inputSchema: z.ZodObject;
  };

  type Args = { courseId: string; confirmationToken?: string };

  function register(name: string) {
    let config!: Registered;
    let callback!: (args: never, ctx: never) => Promise<unknown>;
    const ran = vi.fn(async () => ({ success: true }));

    registerApprovedTool(
      {
        registerTool: (_name: string, cfg: Registered, cb: typeof callback) => {
          config = cfg;
          callback = cb;
        },
      } as unknown as McpServer,
      {
        name,
        description: "Does a thing.",
        inputSchema: z.object({ courseId: z.string() }),
        undone: "nothing changed",
      },
      async ({ courseId }) => ({
        courseId,
        ids: ["a"],
        message: "Do the thing?",
        run: ran,
      }),
    );

    const call = (args: Args) =>
      callback(
        args as never,
        {
          mcpReq: { inputResponses: undefined, requestState: () => undefined },
        } as never,
      ) as Promise<{ content: { text: string }[] }>;

    return { config, call, ran };
  }

  async function output(result: Promise<{ content: { text: string }[] }>) {
    return JSON.parse((await result).content[0]!.text) as {
      success: boolean;
      needsConfirmation?: boolean;
      confirmationToken?: string;
    };
  }

  it("A11: teaches every gated tool the two-call protocol in one wording", () => {
    const { config } = register("doThing");

    expect(config.description).toContain("Does a thing.");
    expect(config.description).toContain("needsConfirmation:true");
    expect(
      config.inputSchema.safeParse({
        courseId: "course-1",
        confirmationToken: "t",
      }).data,
    ).toEqual({ courseId: "course-1", confirmationToken: "t" });
  });

  it("A11: mints the token from the registered name, so no tool opens another's gate", async () => {
    const mine = register("doThing");
    const other = register("doOtherThing");

    const asked = await output(mine.call({ courseId: "course-1" }));
    expect(asked.confirmationToken).toBe(
      approvalToken("doThing", "course-1", ["a"]),
    );

    const crossed = await output(
      other.call({
        courseId: "course-1",
        confirmationToken: asked.confirmationToken,
      }),
    );
    expect(crossed.success).toBe(false);
    expect(other.ran).not.toHaveBeenCalled();
  });

  it("A11: runs the work only once the token comes back", async () => {
    const { call, ran } = register("doThing");

    const asked = await output(call({ courseId: "course-1" }));
    expect(ran).not.toHaveBeenCalled();

    const done = await output(
      call({
        courseId: "course-1",
        confirmationToken: asked.confirmationToken,
      }),
    );
    expect(done.success).toBe(true);
    expect(ran).toHaveBeenCalledTimes(1);
  });
});
