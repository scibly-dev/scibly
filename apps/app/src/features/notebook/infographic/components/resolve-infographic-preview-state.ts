import type { InfographicImage } from "./merge-infographic-images";

export type InfographicPreviewState = "loading" | "error" | "ready" | null;

export function resolveInfographicPreviewState(
  selectedImage: InfographicImage | null | undefined,
  isImagesLoading: boolean,
  awaitingNewGeneration = false,
): InfographicPreviewState {
  if (awaitingNewGeneration) return "loading";
  if (selectedImage?.isPending) return "loading";
  if (selectedImage?.isError && !selectedImage.output?.url) return "error";
  if (selectedImage?.output?.url) return "ready";
  if (isImagesLoading) return "loading";
  return null;
}
