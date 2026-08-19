import "server-only";
import {
  computeScaledDimensions,
  IMAGE_UPLOAD_MAX_DIMENSION_PX,
  IMAGE_WEBP_MEDIA_TYPE,
  pickBestWebpQualityIndex,
  resolveCompressionTargetByteSize,
  WEBP_QUALITY_PRESETS,
} from "@/lib/utils/compress-image-core";

interface CompressedImageBuffer {
  buffer: Buffer;
  mediaType: typeof IMAGE_WEBP_MEDIA_TYPE;
  width: number;
  height: number;
  byteSize: number;
}

interface CompressImageOptions {
  preferMaxQuality?: boolean;
}

export async function compressImageBufferForUpload(
  input: Uint8Array,
  sourceByteSize = input.byteLength,
  options?: CompressImageOptions,
): Promise<CompressedImageBuffer> {
  const { default: sharp } = await import("sharp");
  const image = sharp(Buffer.from(input));
  const metadata = await image.metadata();
  const sourceWidth = metadata.width ?? IMAGE_UPLOAD_MAX_DIMENSION_PX;
  const sourceHeight = metadata.height ?? IMAGE_UPLOAD_MAX_DIMENSION_PX;
  const { width, height } = computeScaledDimensions(sourceWidth, sourceHeight);

  const resized = image.resize(width, height, {
    fit: "inside",
    withoutEnlargement: true,
  });

  const targetByteSize = resolveCompressionTargetByteSize(sourceByteSize);
  const encodedSizes: number[] = [];
  const encodedBuffers: Buffer[] = [];

  for (const quality of WEBP_QUALITY_PRESETS) {
    const buffer = await resized
      .clone()
      .webp({ quality: Math.round(quality * 100) })
      .toBuffer();
    encodedBuffers.push(buffer);
    encodedSizes.push(buffer.byteLength);
  }

  const qualityIndex = options?.preferMaxQuality
    ? 0
    : pickBestWebpQualityIndex(encodedSizes, targetByteSize);
  const buffer = encodedBuffers[qualityIndex]!;

  return {
    buffer,
    mediaType: IMAGE_WEBP_MEDIA_TYPE,
    width,
    height,
    byteSize: buffer.byteLength,
  };
}
