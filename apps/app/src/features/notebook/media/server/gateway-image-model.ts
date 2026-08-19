import { generateText } from "ai";

import "server-only";
import {
  getImageGenerationLanguageModel,
  resolveImageGenerationAspectRatio,
} from "@/shared/ai/server/models/registry";

export async function callGatewayImageModel({
  prompt,
  aspectRatio,
  abortSignal,
  sourceImage,
  instruction,
}: {
  prompt?: string;
  aspectRatio?: string;
  abortSignal: AbortSignal;
  sourceImage?: { bytes: Uint8Array; mediaType: string };
  instruction?: string;
}): Promise<{ uint8Array: Uint8Array; mediaType?: string }> {
  const resolvedAspectRatio = aspectRatio
    ? resolveImageGenerationAspectRatio(aspectRatio)
    : undefined;

  const result = await generateText({
    model: getImageGenerationLanguageModel(),
    ...(sourceImage
      ? {
          messages: [
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: instruction ?? prompt ?? "" },
                {
                  type: "image" as const,
                  image: sourceImage.bytes,
                  mediaType: sourceImage.mediaType,
                },
              ],
            },
          ],
        }
      : { prompt: prompt ?? "" }),
    maxRetries: 1,
    abortSignal,
    providerOptions: {
      google: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig:
          resolvedAspectRatio && !sourceImage
            ? { aspectRatio: resolvedAspectRatio }
            : undefined,
      },
    },
  });

  const image = result.files.find((file) =>
    file.mediaType.startsWith("image/"),
  );
  if (!image) {
    throw new Error(
      sourceImage
        ? "Image model returned no edited image file."
        : "Image model returned no image file.",
    );
  }

  return image;
}
