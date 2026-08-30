import type { Principal } from "@scibly/auth/session";
import type { ToolSet, UIMessageStreamWriter } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { TrpcCaller } from "@/server/api/root";

import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";

import {
  buildToolRegistry,
  getNotebookSkills,
} from "@/features/notebook/server";

import { MCP_TOOL_NAMES, type OrgScope, scopeToolInput } from "./tool-surface";

/**
 * MCP has no transcript, so streamed deltas go nowhere — no allow-listed tool
 * streams today, and one that does needs a real writer before it is listed.
 */
const NO_STREAM: UIMessageStreamWriter<NotebookMessage> = {
  write: () => {},
  merge: () => {},
  onError: undefined,
};

export type McpGrant = {
  caller: TrpcCaller;
  session: Principal;
  scope: OrgScope;
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

/**
 * Points a token-less client at this resource's OAuth metadata;
 * `Access-Control-Expose-Headers` is what lets a browser client read it.
 */
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
    {
      caller: grant.caller,
      session: grant.session,
      orgSlug: grant.scope.orgSlug,
      dataStream: NO_STREAM,
    },
    // `loadSkill` names the available skills in its own input schema.
    await getNotebookSkills(),
  );

  const server = new McpServer({ name: "scibly", version: "1.0.0" });

  for (const name of MCP_TOOL_NAMES) {
    const tool = registry[name];
    const execute = tool?.execute;
    if (!execute) continue;

    const { schema, inject } = scopeToolInput(tool.inputSchema, grant.scope);

    server.registerTool(
      name,
      {
        description:
          typeof tool.description === "string" ? tool.description : undefined,
        inputSchema: schema,
      },
      async (args) => {
        const output = await execute(
          { ...args, ...inject },
          {
            toolCallId: name,
            messages: [],
            context: undefined,
          },
        );
        return { content: [{ type: "text", text: JSON.stringify(output) }] };
      },
    );
  }

  return createMcpHandler(() => server, { legacy: "stateless" }).fetch(request);
}
