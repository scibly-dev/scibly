import type {
  ClientCapabilities,
  ServerContext,
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

export function approvalToken(
  tool: string,
  courseId: string,
  ids: readonly string[],
): string {
  // JSON, not `join`: an id containing the separator must not re-cut into a different set.
  return JSON.stringify([tool, courseId, [...ids].sort()]);
}

export type ApprovalRequest = {
  token: string;
  message: string;
  refusals: ApprovalRefusals;
};

const UNASKABLE =
  "This client cannot be asked to show the author an approval, and the author's approval is required, so nothing was done. " +
  "Tell the author to do it in Scibly themselves, or to connect a client that supports elicitation on MCP revision 2026-07-28. Calling again will not help.";

/** A result means the tool is done — asking or refusing; `null` means go. */
export function approval(
  ctx: ServerContext,
  { token, message, refusals }: ApprovalRequest,
): ReturnType<typeof inputRequired> | ReturnType<typeof text> | null {
  const answer = inputResponse(ctx.mcpReq.inputResponses, "confirm");

  if (answer.kind !== "elicit") {
    // Capabilities reach a per-request handler only in the 2026-07-28 `_meta`
    // envelope, so a 2025-era client cannot be asked at all (ADR 0006).
    // SAFETY: the SDK validates the envelope before dispatch; the cast only
    // restores the key type its published `{}` alias lost.
    const envelope = ctx.mcpReq.envelope as
      | Record<string, ClientCapabilities | undefined>
      | undefined;
    if (!envelope?.[CLIENT_CAPABILITIES_META_KEY]?.elicitation) {
      return text({ success: false, message: UNASKABLE });
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
