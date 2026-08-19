import crypto from "crypto";
import { z } from "zod";

import { env } from "@/env";

export const ALGORITHM = "aes-256-gcm" as const;

export function encryptApiKey(plaintext: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error(
      "[BYOAI] ENCRYPTION_KEY is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  });
}

const ciphertextSchema = z.object({
  iv: z.string(),
  tag: z.string(),
  data: z.string(),
});

export function decryptApiKey(ciphertext: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error(
      "[BYOAI] ENCRYPTION_KEY is not set — cannot decrypt stored API key.",
    );
  }
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const { iv, tag, data } = ciphertextSchema.parse(JSON.parse(ciphertext));

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
