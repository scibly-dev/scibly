import type { GeneratedImageMetadata } from "./generated-image-types";

export function toGeneratedImageMetadata(
  input: Pick<
    GeneratedImageMetadata,
    | "alt"
    | "prompt"
    | "width"
    | "height"
    | "byteSize"
    | "aspectRatio"
    | "createdAt"
  >,
): GeneratedImageMetadata {
  return {
    alt: input.alt,
    prompt: input.prompt,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
    byteSize: input.byteSize,
    aspectRatio: input.aspectRatio ?? undefined,
    createdAt: input.createdAt,
  };
}

export function formatFileSize(bytes: number | undefined): string | undefined {
  if (bytes == null || bytes <= 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDimensions(
  width: number | undefined,
  height: number | undefined,
): string | undefined {
  if (width == null || height == null) return undefined;
  return `${width} × ${height} px`;
}

export function formatCreatedAt(
  value: Date | string | undefined,
): string | undefined {
  if (value == null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
