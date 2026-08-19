import { maxImageSizeInBytes } from "@/lib/file/media-limits";

export const IMAGE_UPLOAD_MAX_DIMENSION_PX = 2560;
export const WEBP_QUALITY_PRESETS = [0.95, 0.85, 0.75] as const;
export const IMAGE_WEBP_MEDIA_TYPE = "image/webp" as const;

export function computeScaledDimensions(
  width: number,
  height: number,
  maxDimension = IMAGE_UPLOAD_MAX_DIMENSION_PX,
) {
  const scaleFactor = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scaleFactor)),
    height: Math.max(1, Math.round(height * scaleFactor)),
    scaleFactor,
  };
}

export function resolveCompressionTargetByteSize(
  sourceByteSize: number,
): number {
  return Math.min(sourceByteSize, maxImageSizeInBytes);
}

export function pickBestWebpQualityIndex(
  sizesByQuality: readonly number[],
  targetByteSize: number,
): number {
  for (let index = 0; index < sizesByQuality.length; index += 1) {
    if (sizesByQuality[index]! <= targetByteSize) {
      return index;
    }
  }
  return sizesByQuality.length - 1;
}
