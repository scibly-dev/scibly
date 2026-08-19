import type { ImageAnnotateRegion } from "@/features/notebook/media/tools/image-schemas";

import "server-only";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function regionRadiusPx(
  region: ImageAnnotateRegion,
  width: number,
  height: number,
): number {
  const shortEdge = Math.min(width, height);
  return Math.max(14, (clamp(region.radius, 1, 100) / 100) * shortEdge);
}

function regionCenterPx(
  region: ImageAnnotateRegion,
  width: number,
  height: number,
) {
  return {
    cx: (clamp(region.x, 0, 100) / 100) * width,
    cy: (clamp(region.y, 0, 100) / 100) * height,
  };
}

export async function normalizeImageForEdit(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; mediaType: "image/png" }> {
  const { default: sharp } = await import("sharp");
  const out = await sharp(Buffer.from(bytes)).png().toBuffer();
  return { bytes: new Uint8Array(out), mediaType: "image/png" };
}

export async function annotateRegions(
  bytes: Uint8Array,
  regions: ImageAnnotateRegion[],
): Promise<{ bytes: Uint8Array; mediaType: "image/png" }> {
  const { default: sharp } = await import("sharp");

  const base = sharp(Buffer.from(bytes));
  const metadata = await base.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;
  const shortEdge = Math.min(width, height);

  const stroke = Math.max(3, Math.round(shortEdge * 0.006));
  const badge = Math.max(16, Math.round(shortEdge * 0.032));
  const fontSize = Math.round(badge * 1.15);

  const markers = regions
    .map((region, index) => {
      const { cx, cy } = regionCenterPx(region, width, height);
      const r = regionRadiusPx(region, width, height);
      const bx = cx - r * 0.707;
      const by = cy - r * 0.707;
      return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ff00d4" stroke-width="${stroke}" />
    <circle cx="${bx}" cy="${by}" r="${badge}" fill="#ff00d4" />
    <text x="${bx}" y="${by}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${index + 1}</text>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${markers}\n</svg>`;

  const out = await base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return { bytes: new Uint8Array(out), mediaType: "image/png" };
}

function blendRegionPixels({
  mask,
  original,
  edited,
  pixelCount,
  retainGlobalChanges,
  globalChangeThreshold,
}: {
  mask: Buffer;
  original: Buffer;
  edited: Buffer;
  pixelCount: number;
  retainGlobalChanges: boolean;
  globalChangeThreshold: number;
}) {
  const channels = 4;
  const output = Buffer.alloc(pixelCount * channels);
  for (let index = 0; index < pixelCount; index += 1) {
    const blend = mask[index]! / 255;
    const base = index * channels;
    const maxChannelDiff = Math.max(
      Math.abs(edited[base]! - original[base]!),
      Math.abs(edited[base + 1]! - original[base + 1]!),
      Math.abs(edited[base + 2]! - original[base + 2]!),
    );
    const keepGlobal =
      retainGlobalChanges &&
      blend < 0.5 &&
      maxChannelDiff >= globalChangeThreshold;
    for (let channel = 0; channel < 3; channel += 1) {
      output[base + channel] = keepGlobal
        ? edited[base + channel]!
        : Math.round(
            edited[base + channel]! * blend +
              original[base + channel]! * (1 - blend),
          );
    }
    output[base + 3] = 255;
  }
  return output;
}

export async function preserveUnmarkedRegions(
  originalBytes: Uint8Array,
  editedBytes: Uint8Array,
  regions: ImageAnnotateRegion[],
  options?: {
    retainGlobalChangesOutsideRegions?: boolean;
    globalChangeThreshold?: number;
  },
): Promise<{ bytes: Uint8Array; mediaType: "image/png" }> {
  if (regions.length === 0) {
    return normalizeImageForEdit(editedBytes);
  }

  const { default: sharp } = await import("sharp");

  const originalMeta = await sharp(Buffer.from(originalBytes)).metadata();
  const width = originalMeta.width ?? 1024;
  const height = originalMeta.height ?? 1024;
  const shortEdge = Math.min(width, height);
  const feather = Math.max(2, Math.round(shortEdge * 0.005));

  const circles = regions
    .map((region) => {
      const { cx, cy } = regionCenterPx(region, width, height);
      const r = regionRadiusPx(region, width, height);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" />`;
    })
    .join("");

  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#000000"/>${circles}</svg>`;

  const maskRaw = await sharp(Buffer.from(maskSvg))
    .blur(feather)
    .resize(width, height, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const toRgbaRaw = (bytes: Uint8Array) =>
    sharp(Buffer.from(bytes))
      .resize(width, height, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

  const [original, edited] = await Promise.all([
    toRgbaRaw(originalBytes),
    toRgbaRaw(editedBytes),
  ]);

  const pixelCount = width * height;
  const retainGlobalChanges =
    options?.retainGlobalChangesOutsideRegions ?? false;
  const globalChangeThreshold = options?.globalChangeThreshold ?? 20;
  const out = blendRegionPixels({
    mask: maskRaw,
    original: original.data,
    edited: edited.data,
    pixelCount,
    retainGlobalChanges,
    globalChangeThreshold,
  });

  const result = await sharp(out, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  return { bytes: new Uint8Array(result), mediaType: "image/png" };
}
