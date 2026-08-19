import type { GeneratedImageListItem } from "@/features/notebook/media/tools/image-schemas";
import type { ImageGenerationInvocation } from "../../media/generated-image/tool-part";

export type InfographicImage = ImageGenerationInvocation & { id: string };

function getInfographicImageId(
  invocation: ImageGenerationInvocation,
): string | null {
  const imageId = invocation.output?.imageId;
  if (imageId) return imageId;
  if (invocation.toolCallId) return `pending:${invocation.toolCallId}`;
  return null;
}

function normalizeInfographicImage(
  invocation: ImageGenerationInvocation,
): InfographicImage | null {
  const id = getInfographicImageId(invocation);
  if (!id) return null;
  return { ...invocation, id };
}

export function resolveInfographicSelectionId(
  images: InfographicImage[],
  lookupKey: string | null,
): string | null {
  if (!lookupKey) return null;
  if (images.some((image) => image.id === lookupKey)) return lookupKey;

  const pendingId = `pending:${lookupKey}`;
  if (images.some((image) => image.id === pendingId)) return pendingId;

  const byToolCallId = images.find((image) => image.toolCallId === lookupKey);
  return byToolCallId?.id ?? null;
}

function generatedImageListItemToInvocation(
  item: GeneratedImageListItem,
  chatOverlay?: ImageGenerationInvocation,
): ImageGenerationInvocation {
  const output = {
    imageId: item.id,
    url: item.url,
    prompt: item.prompt,
    alt: item.alt,
    mediaType: "image/webp" as const,
    aspectRatio: item.aspectRatio,
    width: item.width,
    height: item.height,
    byteSize: item.byteSize,
  };

  if (chatOverlay) {
    const mergedOutput = chatOverlay.output ?? output;
    const isPending = chatOverlay.isPending;

    return {
      toolCallId: chatOverlay.toolCallId ?? item.toolCallId,
      prompt: chatOverlay.prompt ?? item.prompt,
      alt: chatOverlay.alt ?? item.alt,
      output: mergedOutput,
      isDone: isPending ? chatOverlay.isDone : true,
      isPending,
      isError: isPending ? chatOverlay.isError : false,
      errorText: isPending ? chatOverlay.errorText : undefined,
    };
  }

  return {
    toolCallId: item.toolCallId,
    prompt: item.prompt,
    alt: item.alt,
    output,
    isDone: true,
    isPending: false,
    isError: false,
  };
}

export function mergeInfographicImages(
  libraryItems: GeneratedImageListItem[],
  chatInvocations: ImageGenerationInvocation[],
): InfographicImage[] {
  const chatByImageId = new Map<string, ImageGenerationInvocation>();

  for (const invocation of chatInvocations) {
    const imageId = invocation.output?.imageId;
    if (imageId) {
      chatByImageId.set(imageId, invocation);
    }
  }

  const libraryImageIds = new Set(libraryItems.map((item) => item.id));
  const mergedLibrary = libraryItems.map((item) =>
    generatedImageListItemToInvocation(item, chatByImageId.get(item.id)),
  );

  const floatingInvocations = chatInvocations
    .filter((invocation) => {
      const imageId = invocation.output?.imageId;
      if (imageId && libraryImageIds.has(imageId)) return false;
      if (invocation.isPending) return true;
      return Boolean(imageId && invocation.output?.url);
    })
    .toReversed();

  return [...floatingInvocations, ...mergedLibrary]
    .map(normalizeInfographicImage)
    .filter((image): image is InfographicImage => image !== null);
}
