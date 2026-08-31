import { clientIp, withRateLimit } from "@scibly/api/rate-limit";
import { createTRPCContext } from "@scibly/api/trpc";
import { auth } from "@scibly/auth/config";
import { db } from "@scibly/db";

import {
  handleMcpRequest,
  jsonRpcError,
  mcpUnauthorized,
} from "@/features/mcp/server";
import { createCaller } from "@/server/api/root";

export const MAX_MCP_REQUESTS_PER_WINDOW = 600;

/** One address can be a whole office behind one NAT, so this is a backstop against unauthenticated traffic, not an agent's budget. */
export const MAX_MCP_REQUESTS_PER_IP_PER_WINDOW = 3_000;

const tooManyRequests = async () =>
  jsonRpcError(-32002, "Rate limit exceeded", { status: 429 });

/**
 * The token carries a user, not an organization (ADR 0004), and the endpoint
 * names none either: an agent reaches exactly what its author reaches, naming
 * the organization per call, and each procedure authorizes the one it is given.
 */
export async function POST(request: Request) {
  try {
    // Ahead of the token lookup: an unauthenticated flood should cost one
    // counter increment, not a token read and a user read per request.
    return await withRateLimit(
      {
        db,
        identifier: clientIp(request.headers),
        endpoint: "mcp.request.ip",
        maxPerWindow: MAX_MCP_REQUESTS_PER_IP_PER_WINDOW,
      },
      () => handle(request),
      tooManyRequests,
    );
  } catch (error) {
    console.error("[mcp] request failed:", error);
    return jsonRpcError(-32603, "Internal error", { status: 500 });
  }
}

async function handle(request: Request) {
  const token = await auth.api.getMcpSession({ headers: request.headers });
  // better-auth matches on the token string alone, so expiry is ours, and the
  // test is inverted so an unreadable date (NaN) fails closed.
  if (
    !token?.userId ||
    !(new Date(token.accessTokenExpiresAt).getTime() > Date.now())
  ) {
    return mcpUnauthorized(request);
  }

  // Only what a principal is: the rest of the row (billing ids, notification
  // and onboarding flags) has no business reaching a tool call.
  const user = await db.user.findUnique({
    where: { id: token.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return mcpUnauthorized(request);

  const session = { user };

  return withRateLimit(
    {
      db,
      identifier: user.id,
      endpoint: "mcp.request",
      maxPerWindow: MAX_MCP_REQUESTS_PER_WINDOW,
    },
    async () =>
      handleMcpRequest(request, {
        session,
        caller: createCaller(
          await createTRPCContext({
            headers: request.headers,
            principal: session,
          }),
        ),
      }),
    tooManyRequests,
  );
}
