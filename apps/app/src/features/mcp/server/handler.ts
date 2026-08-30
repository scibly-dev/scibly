import type { Principal } from "@scibly/auth/session";
import type { ToolSet, UIMessageStreamWriter } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { TrpcCaller } from "@/server/api/root";

import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";

import {
  buildToolRegistry,
  getNotebookSkills,
} from "@/features/notebook/server";

import { registerSceneContentTools } from "./scene-content-tools";
import { MCP_TOOL_NAMES, mcpToolInput } from "./tool-surface";

/** MCP has no transcript, so a tool that actually streams needs a real writer before it is allow-listed. */
const NO_STREAM: UIMessageStreamWriter<NotebookMessage> = {
  write: () => {},
  merge: () => {},
  onError: undefined,
};

export type McpGrant = {
  caller: TrpcCaller;
  session: Principal;
};

/** Codes come from the -320xx implementation range the spec leaves to the server. */
export function jsonRpcError(
  code: number,
  message: string,
  init: ResponseInit,
): Response {
  return Response.json(
    { jsonrpc: "2.0", id: null, error: { code, message } },
    init,
  );
}

/** `Access-Control-Expose-Headers` is what lets a browser client read the challenge. */
export function mcpUnauthorized(request: Request): Response {
  const challenge = `Bearer resource_metadata="${new URL(request.url).origin}/.well-known/oauth-protected-resource"`;
  return jsonRpcError(-32000, "Unauthorized: Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": challenge,
      "Access-Control-Expose-Headers": "WWW-Authenticate",
    },
  });
}

export async function handleMcpRequest(
  request: Request,
  grant: McpGrant,
): Promise<Response> {
  const registry: ToolSet = await buildToolRegistry(
    // No organization: the agent names one per call, the way it names a course
    // or a lesson, and every tool that takes one authorizes it for this user.
    { caller: grant.caller, session: grant.session, dataStream: NO_STREAM },
    // `loadSkill` names the available skills in its own input schema.
    await getNotebookSkills(),
  );

  const server = new McpServer({ name: "scibly", version: "1.0.0" });

  for (const name of MCP_TOOL_NAMES) {
    const tool = registry[name];
    const execute = tool?.execute;
    if (!execute) continue;

    server.registerTool(
      name,
      {
        description:
          typeof tool.description === "string" ? tool.description : undefined,
        inputSchema: mcpToolInput(tool.inputSchema),
      },
      async (args) => {
        const output = await execute(args, {
          toolCallId: name,
          messages: [],
          context: undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(output) }] };
      },
    );
  }

  registerSceneContentTools(server, grant.session.user);

  return createMcpHandler(() => server, { legacy: "stateless" }).fetch(request);
}
