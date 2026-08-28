import type {
  IntegrationProviderId,
  PageIntegrationProviderId,
} from "../contracts";

import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";
import { routes } from "@scibly/routes";

import { resolveOrg } from "@/features/organizations/server";
import { signOAuthState } from "@/lib/crypto/oauth-state";

import { resolveConnectionToken } from "../server/connection-token";
import { detachSourcesFromConnection } from "../server/detach-sources";
import {
  getPageProvider,
  getProvider,
  listProviders,
} from "../server/registry";
import {
  disconnectIntegrationSchema,
  getAuthUrlSchema,
  listGrantsSchema,
  listPageChildrenSchema,
  orgSlugInput,
  searchPagesSchema,
} from "./integration.schema";

// No credential is touched here — enough for anything that only needs to know
// the connection exists.
export async function resolveConnectionRow(
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
  return { connection, provider: getProvider(providerId) };
}

export async function resolveConnection(
  organizationId: string,
  providerId: IntegrationProviderId,
) {
  const resolved = await resolveConnectionRow(organizationId, providerId);
  return {
    ...resolved,
    token: await resolveConnectionToken(resolved.connection),
  };
}

// Page-shaped work goes through here instead: the provider it hands back is
// one that has pages.
export async function resolvePageConnection(
  organizationId: string,
  providerId: PageIntegrationProviderId,
) {
  const { connection, token } = await resolveConnection(
    organizationId,
    providerId,
  );
  return { connection, token, provider: getPageProvider(providerId) };
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
      // The browser cannot check a server method for itself, so the one place
      // that can says whether the provider has one.
      listsGrants: Boolean(provider.listGrants),
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
      const redirectUri = routes.app.api.integrations.callback(input.provider);
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

      // One transaction: a detach that committed without its delete would
      // leave the connection listed as live with none of its sources attached,
      // and the next disconnect would have nothing left to warn on.
      if (connection) {
        await db.$transaction(async (tx) => {
          await detachSourcesFromConnection(
            connection.id,
            input.provider,
            "disconnected",
            tx,
          );
          await tx.integrationConnection.delete({
            where: { id: connection.id },
          });
        });
      }
      return { success: true };
    }),

  // Its own procedure rather than part of `list`, so the settings page never
  // waits on a provider that is slow or down.
  listGrants: protectedProcedure
    .input(listGrantsSchema)
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
      return (
        (await provider.listGrants?.(token)) ?? { grants: [], totalCount: 0 }
      );
    }),

  searchPages: protectedProcedure
    .input(searchPagesSchema)
    .query(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      const { provider, token } = await resolvePageConnection(
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
      const { provider, token } = await resolvePageConnection(
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
