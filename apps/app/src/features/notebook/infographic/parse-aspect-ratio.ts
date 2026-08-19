"use client";

export function parseAspectRatio(
  ratio: string,
): { w: number; h: number } | null {
  if (!ratio.includes(":")) return null;
  const [wStr, hStr] = ratio.split(":");
  const w = Number(wStr);
  const h = Number(hStr);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
    return null;
  return { w, h };
}
