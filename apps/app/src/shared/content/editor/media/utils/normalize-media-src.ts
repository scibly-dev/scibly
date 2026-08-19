// next/image renders `<img src="/_next/image?url=...">`; feeding a re-parsed
// one back into next/image fails because "localhost" is not in `images.remotePatterns`.
export function normalizeMediaSrc(
  src: string | null | undefined,
): string | null {
  if (!src) return src ?? null;

  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const parsed = src.startsWith("http") ? new URL(src) : new URL(src, base);

    if (parsed.pathname === "/_next/image") {
      const original = parsed.searchParams.get("url");
      if (original) return decodeURIComponent(original);
    }
  } catch {}

  return src;
}
