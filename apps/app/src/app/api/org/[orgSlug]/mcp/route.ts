import { AppError } from "@scibly/api/application-error";
import { withRateLimit } from "@scibly/api/rate-limit";
import { createTRPCContext } from "@scibly/api/trpc";
import { auth } from "@scibly/auth/config";
import { db } from "@scibly/db";

import {
  handleMcpRequest,
  jsonRpcError,
  mcpUnauthorized,
} from "@/features/mcp/server/handler";
import { resolveTenantContext } from "@/features/organizations/server/policy";
import { createCaller } from "@/server/api/root";

export const MAX_MCP_REQUESTS_PER_WINDOW = 600;

/** The slug gates entry; the token carries a user, not an organization (ADR 0004), and ids beyond the slug are authorized by the procedure behind each tool. */
export async function POST(
  request: Request,
  context: { params: Promise<{ orgSlug: string }> },
) {
  try {
    return await handle(request, (await context.params).orgSlug);
  } catch (error) {
    console.error("[mcp] request failed:", error);
    return jsonRpcError(-32603, "Internal error", { status: 500 });
  }
}

async function handle(request: Request, orgSlug: string) {
  const token = await auth.api.getMcpSession({ headers: request.headers });
  // better-auth matches on the token string alone, so expiry is ours, and the
  // test is inverted so an unreadable date (NaN) fails closed.
  if (
    !token?.userId ||
    !(new Date(token.accessTokenExpiresAt).getTime() > Date.now())
  ) {
    return mcpUnauthorized(request);
  }

  const [user, tenant] = await Promise.all([
    db.user.findUnique({ where: { id: token.userId } }),
    resolveTenantContext(orgSlug, { userId: token.userId }, "member").catch(
      (error: unknown) => {
        if (
          error instanceof AppError &&
          (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")
        ) {
          return null;
        }
        throw error;
      },
    ),
  ]);

  if (!user) return mcpUnauthorized(request);

  // One refusal for "no such org" and "not your org" alike, so an agent can't
  // enumerate organizations by their slugs.
  if (!tenant) {
    return jsonRpcError(
      -32001,
      "Forbidden: not a member of this organization",
      {
        status: 403,
      },
    );
  }

  const session = { user };

  return withRateLimit(
    {
      db,
      identifier: `${user.id}:${orgSlug}`,
      endpoint: "mcp.request",
      maxPerWindow: MAX_MCP_REQUESTS_PER_WINDOW,
    },
    async () =>
      handleMcpRequest(request, {
        session,
        scope: { orgSlug, organizationId: tenant.organization.id },
        caller: createCaller(
          await createTRPCContext({
            headers: request.headers,
            principal: session,
          }),
        ),
      }),
    async () => jsonRpcError(-32002, "Rate limit exceeded", { status: 429 }),
  );
}
