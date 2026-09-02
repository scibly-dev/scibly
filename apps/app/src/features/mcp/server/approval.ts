import type {
  CallToolResult,
  ClientCapabilities,
  McpServer,
  ServerContext,
  ToolAnnotations,
} from "@modelcontextprotocol/server";

import {
  CLIENT_CAPABILITIES_META_KEY,
  inputRequired,
  inputResponse,
} from "@modelcontextprotocol/server";
import { z } from "zod";

import { text } from "./tool-response";

const CONFIRM_SCHEMA = z.object({
  confirm: z.boolean().describe("Yes — do this."),
});

export type ApprovalRefusals = {
  cancelled: string;
  declined: string;
  mismatched: string;
};

/**
 * The three ways an author says no, in one wording.
 *
 * `undone` completes "…, so nothing was deleted". It names what did not
 * happen, in the tense the tool would have reported it.
 */
export function refusals(undone: string): ApprovalRefusals {
  return {
    cancelled: `The author did not answer; ${undone}. Ask again if this still needs doing.`,
    declined: `The author declined. ${undone[0]!.toUpperCase()}${undone.slice(1)}.`,
    mismatched:
      `This approval was given for a different request, so ${undone}. ` +
      "Call the tool again with what you actually mean, and the author will be asked about that.",
  };
}

export function approvalToken(
  tool: string,
  courseId: string,
  ids: readonly string[],
): string {
  // JSON, not `join`. An id containing the separator would otherwise re-cut
  // into a different set.
  return JSON.stringify([tool, courseId, [...ids].sort()]);
}

const confirmationTokenSchema = z
  .string()
  .optional()
  .describe(
    "Only ever the exact confirmationToken this tool handed back on a previous call, and only once the author has approved that summary. " +
      "Leave it out on a first call, and never write one yourself.",
  );

const APPROVAL_NOTE =
  "The author approves before anything happens, and the tool runs that approval — call it rather than composing your own warning. " +
  "A client that can show a dialog gets one. A client that cannot gets back success:false with needsConfirmation:true, the summary to put in front of the author word for word, and a confirmationToken to send on an otherwise identical second call once they have said yes. " +
  "A refusal comes back as success:false without needsConfirmation; that is an answer, not a failure, so do not call again.";

const CONFIRM_NOTE =
  "Show the author this exact summary and ask them. If they say yes, call the tool again with the same arguments plus the confirmationToken below. If they say no, stop.";

export type ApprovalRequest = {
  token: string;
  message: string;
  refusals: ApprovalRefusals;
  /** What the caller passed back; `undefined` on a first call. */
  confirmationToken?: string;
};

/** A result means the tool is done, asking or refusing. `null` means go. */
export function approval(
  ctx: ServerContext,
  { token, message, refusals, confirmationToken }: ApprovalRequest,
): ReturnType<typeof inputRequired> | ReturnType<typeof text> | null {
  const answer = inputResponse(ctx.mcpReq.inputResponses, "confirm");

  if (answer.kind !== "elicit") {
    // Capabilities reach a per-request handler only in the 2026-07-28 `_meta`
    // envelope, and the 2025-era leg we also serve is stateless. Such a client
    // cannot be elicited at all, so it confirms over two calls (ADR 0006).
    // SAFETY: the SDK validates the envelope before dispatch; the cast only
    // restores the key type its published `{}` alias lost.
    const envelope = ctx.mcpReq.envelope as
      | Record<string, ClientCapabilities | undefined>
      | undefined;
    if (!envelope?.[CLIENT_CAPABILITIES_META_KEY]?.elicitation) {
      if (confirmationToken === undefined) {
        return text({
          success: false,
          needsConfirmation: true,
          message: `${message}\n\n${CONFIRM_NOTE}`,
          confirmationToken: token,
        });
      }
      return confirmationToken === token
        ? null
        : text({ success: false, message: refusals.mismatched });
    }

    return inputRequired({
      inputRequests: {
        confirm: inputRequired.elicit({
          message,
          requestedSchema: CONFIRM_SCHEMA,
        }),
      },
      requestState: token,
    });
  }

  if (answer.action === "cancel") {
    return text({ success: false, message: refusals.cancelled });
  }

  if (answer.action !== "accept" || answer.content?.confirm !== true) {
    return text({ success: false, message: refusals.declined });
  }

  if (ctx.mcpReq.requestState<string>() !== token) {
    return text({ success: false, message: refusals.mismatched });
  }

  return null;
}

/** What a tool reports once its work is done. Extra fields go into the JSON too. */
export type ToolOutcome = { success: boolean };

/** What a tool decided to do, once the author approves it. */
export type Approvable = {
  courseId: string;
  /** What the approval binds to within the course; omitted when the course itself is the subject. */
  ids?: readonly string[];
  /** The summary the author reads, in a dialog or in the client's own words. */
  message: string;
  run: () => Promise<ToolOutcome>;
};

/** `CallToolResult` carries an index signature, so `'run' in planned` does not narrow it away. */
function isApprovable(
  planned: Approvable | CallToolResult,
): planned is Approvable {
  // SAFETY: reading one property off the union to test it. The predicate is
  // what turns that test into the narrowing, and a result never carries `run`.
  return typeof (planned as Approvable).run === "function";
}

/**
 * Registers a tool whose work waits on the author.
 *
 * `plan` does the reading and the refusing. It returns either a plain result,
 * meaning it found nothing to approve, or a description of the one thing it
 * would do. The gate, its two wordings, the `confirmationToken` field and the
 * note teaching a caller to use it are the same for every such tool, so they
 * live here rather than in each one.
 */
export function registerApprovedTool<Input extends z.ZodObject>(
  server: McpServer,
  config: {
    name: string;
    description: string;
    inputSchema: Input;
    annotations?: ToolAnnotations;
    /** Completes "…, so nothing was deleted" when the author says no. */
    undone: string;
  },
  plan: (
    args: z.output<Input>,
    ctx: ServerContext,
  ) => Promise<Approvable | CallToolResult>,
): void {
  const refused = refusals(config.undone);

  server.registerTool(
    config.name,
    {
      description: `${config.description} ${APPROVAL_NOTE}`,
      inputSchema: config.inputSchema.extend({
        confirmationToken: confirmationTokenSchema,
      }),
      ...(config.annotations && { annotations: config.annotations }),
    },
    async (raw, ctx) => {
      // SAFETY: the SDK validated `raw` against the schema built just above, so
      // it holds the caller's fields plus the one optional string added here.
      // Zod's `.extend` generics do not survive `Input` to say so.
      const args = raw as z.output<Input> & { confirmationToken?: string };

      const planned = await plan(args, ctx);
      if (!isApprovable(planned)) return planned;

      const gate = approval(ctx, {
        token: approvalToken(config.name, planned.courseId, planned.ids ?? []),
        message: planned.message,
        confirmationToken: args.confirmationToken,
        refusals: refused,
      });

      return gate ?? text(await planned.run());
    },
  );
}
