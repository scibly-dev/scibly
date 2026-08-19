import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import { byoaiModelId } from "@/shared/ai/models";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "../../server/policy";
import {
  listRemoteModels,
  testByoaiConnection,
} from "../server/endpoint-probe";
import {
  assertByoaiConfigurationAllowed,
  assertSafeByoaiBaseUrl,
  recordModelTestResult,
  resolveProbeApiKey,
} from "./org-ai-config.operations";
import { connectionInputSchema, orgSlugInput } from "./org-ai-config.schemas";

export const orgAiQueryProcedures = {
  listModels: protectedProcedure
    .input(orgSlugInput)
    .query(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      await requireOrgMember(orgId, ctx.session.user.id);
      const [organization, models] = await Promise.all([
        db.organization.findUnique({
          where: { id: orgId },
          select: { defaultChatModelId: true },
        }),
        db.organizationAIModel.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            name: true,
            baseUrl: true,
            modelId: true,
            description: true,
            contextWindow: true,
            type: true,
            isActive: true,
            lastTestStatus: true,
            lastTestedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      ]);
      return models.map((model) => ({
        ...model,
        isOrgDefaultChatModel: organization?.defaultChatModelId === model.id,
        clientModelId: model.type === "CHAT" ? byoaiModelId(model.id) : null,
      }));
    }),

  getPreferences: protectedProcedure
    .input(orgSlugInput)
    .query(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      await requireOrgMember(orgId, ctx.session.user.id);
      const organization = await db.organization.findUnique({
        where: { id: orgId },
        select: { defaultChatModelId: true },
      });
      return {
        defaultChatModelId: organization?.defaultChatModelId ?? null,
        defaultClientModelId: organization?.defaultChatModelId
          ? byoaiModelId(organization.defaultChatModelId)
          : null,
      };
    }),

  listRemoteModels: protectedProcedure
    .input(
      connectionInputSchema.pick({
        orgSlug: true,
        baseUrl: true,
        apiKey: true,
        existingModelId: true,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");

      return assertByoaiConfigurationAllowed(orgId, userId, async () => {
        await assertSafeByoaiBaseUrl(input.baseUrl);
        const apiKey = await resolveProbeApiKey(
          orgId,
          input.apiKey,
          input.existingModelId,
        );
        return {
          models: await listRemoteModels({ baseUrl: input.baseUrl, apiKey }),
        };
      });
    }),

  testConnection: protectedProcedure
    .input(connectionInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");

      return assertByoaiConfigurationAllowed(orgId, userId, async () => {
        await assertSafeByoaiBaseUrl(input.baseUrl);
        const apiKey = await resolveProbeApiKey(
          orgId,
          input.apiKey,
          input.existingModelId,
        );
        try {
          await testByoaiConnection(input.type, {
            baseUrl: input.baseUrl,
            apiKey,
            modelId: input.modelId,
          });
          if (input.existingModelId) {
            await recordModelTestResult(input.existingModelId, orgId, true);
          }
          return { ok: true as const };
        } catch (error) {
          if (input.existingModelId) {
            await recordModelTestResult(input.existingModelId, orgId, false);
          }
          throw error;
        }
      });
    }),
};
