import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";
import { type z } from "zod";

import { decryptApiKey, encryptApiKey } from "@/lib/crypto/api-key";
import { BYOAI_MODEL_TYPES } from "@/shared/ai/byoai/types";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "../../server/policy";
import { testByoaiConnection } from "../server/endpoint-probe";
import {
  assertByoaiConfigurationAllowed,
  assertSafeByoaiBaseUrl,
} from "./org-ai-config.operations";
import {
  addModelSchema,
  deleteModelSchema,
  updateModelSchema,
} from "./org-ai-config.schemas";

async function resolveNewModelApiKey(
  orgId: string,
  apiKey: string | undefined,
  reuseCredentialsFromId: string | undefined,
) {
  if (!reuseCredentialsFromId) return apiKey?.trim() ?? "";
  const source = await db.organizationAIModel.findFirst({
    where: { id: reuseCredentialsFromId, organizationId: orgId },
    select: { apiKeyEncrypted: true },
  });
  if (!source) {
    throw new Error("Could not reuse credentials — source model not found.");
  }
  return decryptApiKey(source.apiKeyEncrypted);
}

type UpdateModelInput = z.infer<typeof updateModelSchema>;

async function loadExistingModel(input: UpdateModelInput, orgId: string) {
  const existing = await db.organizationAIModel.findFirst({
    where: { id: input.id, organizationId: orgId },
    select: {
      id: true,
      type: true,
      name: true,
      description: true,
      contextWindow: true,
      baseUrl: true,
      apiKeyEncrypted: true,
      modelId: true,
    },
  });
  if (!existing) throw new Error("Model not found.");
  return existing;
}

function detectModelChanges(
  input: UpdateModelInput,
  existing: Awaited<ReturnType<typeof loadExistingModel>>,
  existingApiKey: string,
) {
  const baseUrl =
    input.baseUrl !== undefined && input.baseUrl !== existing.baseUrl;
  const modelId =
    input.modelId !== undefined && input.modelId !== existing.modelId;
  const apiKey = input.apiKey !== undefined && input.apiKey !== existingApiKey;
  return {
    baseUrl,
    modelId,
    apiKey,
    name: input.name !== undefined && input.name !== existing.name,
    description:
      input.description !== undefined &&
      input.description !== existing.description,
    contextWindow:
      input.contextWindow !== undefined &&
      input.contextWindow !== existing.contextWindow,
    connection: baseUrl || modelId || apiKey,
  };
}

async function validateUpdatedConnection(
  input: UpdateModelInput,
  existing: Awaited<ReturnType<typeof loadExistingModel>>,
  existingApiKey: string,
  connectionChanged: boolean,
) {
  const connection = {
    baseUrl: input.baseUrl ?? existing.baseUrl,
    apiKey: input.apiKey ?? existingApiKey,
    modelId: input.modelId ?? existing.modelId,
  };
  await assertSafeByoaiBaseUrl(connection.baseUrl);
  if (!connectionChanged) return;

  const type = BYOAI_MODEL_TYPES.find((known) => known === existing.type);
  await testByoaiConnection(type ?? "CHAT", connection);
}

function buildModelUpdateData(
  input: UpdateModelInput,
  changes: ReturnType<typeof detectModelChanges>,
) {
  return {
    ...(changes.name && { name: input.name }),
    ...(changes.baseUrl && { baseUrl: input.baseUrl }),
    ...(changes.apiKey && {
      apiKeyEncrypted: encryptApiKey(input.apiKey!),
    }),
    ...(changes.modelId && { modelId: input.modelId }),
    ...(changes.description && { description: input.description }),
    ...(changes.contextWindow && { contextWindow: input.contextWindow }),
    ...(changes.connection && {
      lastTestStatus: "OK" as const,
      lastTestedAt: new Date(),
    }),
  };
}

type AddModelInput = z.infer<typeof addModelSchema>;

async function createByoaiModel(orgId: string, input: AddModelInput) {
  await assertSafeByoaiBaseUrl(input.baseUrl);
  const apiKey = await resolveNewModelApiKey(
    orgId,
    input.apiKey,
    input.reuseCredentialsFromId,
  );
  await testByoaiConnection(input.type, {
    baseUrl: input.baseUrl,
    apiKey,
    modelId: input.modelId,
  });
  const created = await db.organizationAIModel.create({
    data: {
      organizationId: orgId,
      name: input.name,
      baseUrl: input.baseUrl,
      apiKeyEncrypted: encryptApiKey(apiKey),
      modelId: input.modelId,
      description: input.description ?? null,
      contextWindow: input.contextWindow ?? null,
      type: input.type,
      isActive: input.type !== "IMAGE",
      lastTestStatus: "OK",
      lastTestedAt: new Date(),
    },
  });
  return { id: created.id };
}

export const orgAiModelProcedures = {
  addModel: protectedProcedure
    .input(addModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");

      return assertByoaiConfigurationAllowed(orgId, userId, () =>
        createByoaiModel(orgId, input),
      );
    }),

  updateModel: protectedProcedure
    .input(updateModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");
      const existing = await loadExistingModel(input, orgId);
      const existingApiKey = decryptApiKey(existing.apiKeyEncrypted);
      const changes = detectModelChanges(input, existing, existingApiKey);
      if (!Object.values(changes).some(Boolean)) return;

      const save = async () => {
        await validateUpdatedConnection(
          input,
          existing,
          existingApiKey,
          changes.connection,
        );
        await db.organizationAIModel.update({
          where: { id: input.id },
          data: buildModelUpdateData(input, changes),
        });
      };

      return assertByoaiConfigurationAllowed(orgId, userId, save);
    }),

  deleteModel: protectedProcedure
    .input(deleteModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");
      const existing = await db.organizationAIModel.findFirst({
        where: { id: input.id, organizationId: orgId },
        select: { type: true },
      });

      await db.organizationAIModel.deleteMany({
        where: { id: input.id, organizationId: orgId },
      });
      if (existing?.type === "CHAT") {
        await db.organization.updateMany({
          where: { id: orgId, defaultChatModelId: input.id },
          data: { defaultChatModelId: null },
        });
      }
    }),
};
