import crypto from "node:crypto";

// Notion rewraps lines on every re-export, so hashing raw bytes would flag
// every dependent scene outdated for edits nobody made.
export function normalizeForContentHash(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function computeContentHash(text: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeForContentHash(text))
    .digest("hex")
    .slice(0, 16);
}
