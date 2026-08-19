import type { IntegrationProviderId } from "../contracts";

import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import { resolveOrg } from "@/features/organizations/server";
import { decryptApiKey } from "@/lib/crypto/api-key";
import { signOAuthState } from "@/lib/crypto/oauth-state";

import { detachSourcesFromConnection } from "../server/detach-sources";
import { getProvider, listProviders } from "../server/registry";
import {
  disconnectIntegrationSchema,
  getAuthUrlSchema,
  listPageChildrenSchema,
  orgSlugInput,
  searchPagesSchema,
} from "./integration.schema";

export async function resolveConnection(
  organizationId: string,
  providerId: IntegrationProviderId,
) {
  const connection = await db.integrationConnection.findUnique({
    where: {
      organizationId_provider: { organizationId, provider: providerId },
    },
  });
  if (!connection) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: `No ${providerId} integration connected for this organization.`,
    });
  }
  return {
    connection,
    provider: getProvider(providerId),
    token: decryptApiKey(connection.accessTokenEncrypted),
  };
}

export const integrationConnectionProcedures = {
  list: protectedProcedure.input(orgSlugInput).query(async ({ input, ctx }) => {
    const { organization } = await resolveOrg(
      input.orgSlug,
      ctx.session.user.id,
      "admin_or_owner",
    );
    const connections = await db.integrationConnection.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        provider: true,
        workspaceId: true,
        workspaceName: true,
        createdAt: true,
        connectedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const allProviders = listProviders().map((provider) => ({
      providerId: provider.providerId,
      displayName: provider.displayName,
    }));
    return { connections, allProviders };
  }),

  getAuthUrl: protectedProcedure
    .input(getAuthUrlSchema)
    .mutation(async ({ input, ctx }) => {
      await resolveOrg(input.orgSlug, ctx.session.user.id, "admin_or_owner");
      const provider = getProvider(input.provider);
      const state = signOAuthState({
        orgSlug: input.orgSlug,
        provider: input.provider,
        userId: ctx.session.user.id,
        lang: input.lang,
      });
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${input.provider.toLowerCase()}/callback`;
      return { authUrl: provider.getAuthUrl(state, redirectUri) };
    }),

  disconnect: protectedProcedure
    .input(disconnectIntegrationSchema)
    .mutation(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      const connection = await db.integrationConnection.findUnique({
        where: {
          organizationId_provider: {
            organizationId: organization.id,
            provider: input.provider,
          },
        },
        select: { id: true },
      });

      if (connection) {
        await detachSourcesFromConnection(
          connection.id,
          input.provider,
          "disconnected",
        );
        await db.integrationConnection.delete({ where: { id: connection.id } });
      }
      return { success: true };
    }),

  searchPages: protectedProcedure
    .input(searchPagesSchema)
    .query(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      const { provider, token } = await resolveConnection(
        organization.id,
        input.provider,
      );
      return { pages: await provider.searchPages(token, input.query) };
    }),

  listPageChildren: protectedProcedure
    .input(listPageChildrenSchema)
    .query(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      const { provider, token } = await resolveConnection(
        organization.id,
        input.provider,
      );
      const pages =
        input.nodeType === "database"
          ? await provider.listDatabasePages(token, input.pageId)
          : await provider.listChildren(token, input.pageId);
      return { pages };
    }),
};
