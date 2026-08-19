import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";
import { z } from "zod";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "../../server/policy";
import { assertByoaiConfigurationAllowed } from "./org-ai-config.operations";

export const orgAiSelectionProcedures = {
  setDefaultChatModel: protectedProcedure
    .input(z.object({ orgSlug: z.string(), modelId: z.string().nullable() }))
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");

      if (input.modelId === null) {
        await db.organization.update({
          where: { id: orgId },
          data: { defaultChatModelId: null },
        });
        return;
      }
      const model = await db.organizationAIModel.findFirst({
        where: {
          id: input.modelId,
          organizationId: orgId,
          type: "CHAT",
        },
        select: { id: true },
      });
      if (!model) throw new Error("Chat model not found.");

      await assertByoaiConfigurationAllowed(orgId, userId, () =>
        db.organization.update({
          where: { id: orgId },
          data: { defaultChatModelId: model.id },
        }),
      );
    }),

  setActiveImageModel: protectedProcedure
    .input(z.object({ orgSlug: z.string(), modelId: z.string().nullable() }))
    .mutation(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const userId = ctx.session.user.id;
      await requireOrgMember(orgId, userId, "admin_or_owner");

      if (input.modelId === null) {
        await db.organizationAIModel.updateMany({
          where: { organizationId: orgId, type: "IMAGE" },
          data: { isActive: false },
        });
        return;
      }
      const model = await db.organizationAIModel.findFirst({
        where: {
          id: input.modelId,
          organizationId: orgId,
          type: "IMAGE",
        },
        select: { id: true },
      });
      if (!model) throw new Error("Image model not found.");
      await assertByoaiConfigurationAllowed(orgId, userId, () =>
        db.$transaction([
          db.organizationAIModel.updateMany({
            where: { organizationId: orgId, type: "IMAGE" },
            data: { isActive: false },
          }),
          db.organizationAIModel.update({
            where: { id: model.id },
            data: { isActive: true },
          }),
        ]),
      );
    }),
};
