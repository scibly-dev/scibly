import type { ImageEditRegion } from "@/features/notebook/media/tools/image-schemas";

import { GENERATED_IMAGE_ALT_MIN_LENGTH } from "@/features/notebook/media/tools/image-schemas";

type SendMessage = (
  message: { text: string },
  options?: {
    body?: {
      imageEdit: {
        sourceImageId: string;
        alt: string;
        prompt?: string;
        regions?: ImageEditRegion[];
      };
    };
  },
) => void | Promise<void>;

function resolveImageEditAlt(sourceAlt: string | undefined): string {
  const trimmed = (sourceAlt ?? "").trim();
  return trimmed.length >= GENERATED_IMAGE_ALT_MIN_LENGTH
    ? trimmed.slice(0, 200)
    : "Refined image";
}

export function sendImageEdit({
  sendMessage,
  sourceImageId,
  alt,
  prompt,
  regions,
  userText,
}: {
  sendMessage: SendMessage;
  sourceImageId: string;
  alt: string;
  prompt?: string;
  regions?: ImageEditRegion[];
  userText: string;
}) {
  return sendMessage(
    { text: userText },
    {
      body: {
        imageEdit: {
          sourceImageId,
          alt: resolveImageEditAlt(alt),
          prompt: prompt || undefined,
          regions: regions?.length ? regions : undefined,
        },
      },
    },
  );
}
