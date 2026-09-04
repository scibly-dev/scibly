import { createHash } from "node:crypto";

/** Stable across a jsonb round-trip: Postgres returns one canonical key order. */
export function practiceContentHash(
  html: string | null | undefined,
  solution: unknown,
): string {
  return createHash("sha256")
    .update(JSON.stringify([html ?? "", solution ?? null]))
    .digest("hex");
}
