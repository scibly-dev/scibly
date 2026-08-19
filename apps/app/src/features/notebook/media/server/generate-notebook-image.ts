import type { ImageGenerationBackend } from "@/shared/ai/server/models/registry";

import { generateImage } from "ai";

import "server-only";
import {
  IMAGE_MODEL_TIMEOUT_MS,
  resolveImageGenerationAspectRatio,
} from "@/shared/ai/server/models/registry";

import { callGatewayImageModel } from "./gateway-image-model";

function logImageBackend(
  event: Record<string, string | number | boolean | undefined>,
) {
  console.info("[generate-notebook-image]", event);
}

export async function generateNotebookImage({
  prompt,
  orgSlug,
  aspectRatio,
  backend,
}: {
  prompt: string;
  orgSlug: string;
  aspectRatio?: string;

  backend: ImageGenerationBackend;
}): Promise<{ image: { uint8Array: Uint8Array; mediaType?: string } }> {
  const resolvedAspectRatio = resolveImageGenerationAspectRatio(aspectRatio);
  const abortSignal = AbortSignal.timeout(IMAGE_MODEL_TIMEOUT_MS);

  if (backend.kind === "byoai") {
    try {
      const result = await generateImage({
        model: backend.model,
        prompt,
        maxRetries: 1,
        abortSignal,
        aspectRatio: resolvedAspectRatio,
      });

      logImageBackend({ orgSlug, backend: "byoai", success: true });
      return { image: result.image };
    } catch (error) {
      logImageBackend({
        orgSlug,
        backend: "byoai",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  const image = await callGatewayImageModel({
    prompt,
    aspectRatio,
    abortSignal,
  });
  logImageBackend({ orgSlug, backend: "gateway", success: true });
  return { image };
}
