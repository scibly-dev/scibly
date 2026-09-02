import { type Page } from "@playwright/test";

/**
 * A wire chunk, or `{ pauseMs }` to pause before the next one; narrowed from the
 * SDK's own wide `UIMessageChunk` union, which Playwright's `addInitScript`
 * serialisability constraint cannot instantiate.
 */
export interface TurnStep {
  type?: string;
  pauseMs?: number;
  id?: string;
  delta?: string;
  toolCallId?: string;
  toolName?: string;
  approvalId?: string;
  input?: unknown;
  data?: string;
  transient?: boolean;
}

/**
 * Answers each chat request with the next scripted turn, in the page: each
 * entry in `turns` answers one `/api/chat` request in order, the last one
 * repeats for every request after it, and an approval step sends a second
 * request — so a turn that stops at an approval needs a follow-up entry or
 * the same decision gets replayed.
 */
export async function scriptTurn(
  page: Page,
  ...turns: TurnStep[][]
): Promise<void> {
  await page.addInitScript((script: TurnStep[][]) => {
    const realFetch = window.fetch.bind(window);
    let served = 0;

    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (!url.includes("/api/chat")) return realFetch(input, init);

      const turn = script[Math.min(served, script.length - 1)] ?? [];
      served += 1;

      const encoder = new TextEncoder();
      const body = new ReadableStream({
        async start(controller) {
          for (const step of turn) {
            const pauseMs = step.pauseMs;
            if (typeof pauseMs === "number") {
              await new Promise((resolve) => setTimeout(resolve, pauseMs));
              continue;
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(step)}\n\n`),
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "x-vercel-ai-ui-message-stream": "v1",
        },
      });
    };
  }, turns);
}

export const says = (text: string): TurnStep[] => [
  { type: "text-start", id: "t1" },
  { type: "text-delta", id: "t1", delta: text },
  { type: "text-end", id: "t1" },
];

export const START = { type: "start" } satisfies TurnStep;
export const FINISH = { type: "finish" } satisfies TurnStep;

export const compaction = (data: "summarizing" | "done" | "failed") => ({
  type: "data-compaction",
  data,
  transient: true,
});

/**
 * `deleteScenes` has no server-side `execute`, so the scripted turn stops at
 * the approval request — what happens next is the author's own action.
 */
export const asksToDeleteScene = (scene: {
  id: string;
  courseId: string;
}): TurnStep[] => [
  {
    type: "tool-input-available",
    toolCallId: "call-1",
    toolName: "deleteScenes",
    input: {
      courseId: scene.courseId,
      reason: "Diese Szene wiederholt die vorherige.",
      sceneIds: [scene.id],
    },
  },
  { type: "tool-approval-request", approvalId: "appr-1", toolCallId: "call-1" },
];
