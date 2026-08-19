import { parseAspectRatio } from "./parse-aspect-ratio";

export function resolveAspectRatioStyle({
  width,
  height,
  aspectRatio,
  fallback = "16 / 9",
}: {
  width?: number;
  height?: number;
  aspectRatio?: string;
  fallback?: string;
}): string {
  if (width && height && width > 0 && height > 0) {
    return `${width} / ${height}`;
  }

  if (aspectRatio) {
    const parsed = parseAspectRatio(aspectRatio);
    if (parsed) return `${parsed.w} / ${parsed.h}`;
  }

  return fallback;
}
