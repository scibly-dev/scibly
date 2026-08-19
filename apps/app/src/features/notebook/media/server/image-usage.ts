import { AppError } from "@scibly/api/application-error";
import { withRateLimit } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";

import "server-only";
import { fundGeneration } from "@/features/organizations/server";
import { ChatError } from "@/shared/ai/errors";

export const IMAGE_GENERATE_USER_LIMIT = 30;

type ImageGenerationCharge = {
  userId: string;
  organizationId: string;
  notebookId: string;

  byoai: boolean;
};

export async function chargeImageGeneration<T>(
  { userId, organizationId, notebookId, byoai }: ImageGenerationCharge,
  generate: () => Promise<T>,
): Promise<T> {
  try {
    return await withRateLimit(
      {
        db,
        identifier: userId,
        endpoint: "image.generate",
        maxPerWindow: IMAGE_GENERATE_USER_LIMIT,
      },

      () =>
        fundGeneration(
          {
            db,
            organizationId,
            actorId: userId,
            action: "IMAGE_GENERATION",
            notebookId,
            ownEndpoint: byoai,
          },
          generate,
        ),
    );
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "TOO_MANY_REQUESTS") {
        throw new ChatError("rate_limit:image");
      }

      if (error.applicationCode === "entitlement.credits_exhausted") {
        throw new ChatError("quota_exceeded:credits");
      }
    }
    throw error;
  }
}
