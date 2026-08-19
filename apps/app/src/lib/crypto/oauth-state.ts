import crypto from "crypto";
import { z } from "zod";

import { env } from "@/env";

interface OAuthStatePayload {
  orgSlug: string;
  provider: string;
  userId: string;
  lang?: string;
}

interface SignedOAuthState extends OAuthStatePayload {
  issuedAt: number;
}

type OAuthStateResult =
  | { ok: true; payload: OAuthStatePayload }
  | { ok: false; reason: "invalid" | "expired" };

export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

function getSecret(): Buffer {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("[OAuthState] ENCRYPTION_KEY is not set.");
  }
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

export function signOAuthState(payload: OAuthStatePayload): string {
  const signed: SignedOAuthState = { ...payload, issuedAt: Date.now() };
  const encodedPayload = Buffer.from(JSON.stringify(signed)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("hex");

  return `${encodedPayload}.${signature}`;
}

const signedState: z.ZodType<SignedOAuthState> = z.object({
  orgSlug: z.string(),
  provider: z.string(),
  userId: z.string(),
  lang: z.string().optional(),
  issuedAt: z.number(),
});

function decodePayload(encodedPayload: string): SignedOAuthState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }
  const state = signedState.safeParse(parsed);
  return state.success ? state.data : null;
}

export function verifyOAuthState(state: string): OAuthStateResult {
  const separatorIndex = state.lastIndexOf(".");
  if (separatorIndex === -1) return { ok: false, reason: "invalid" };

  const encodedPayload = state.slice(0, separatorIndex);
  const signature = state.slice(separatorIndex + 1);

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("hex");

  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return { ok: false, reason: "invalid" };
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) return { ok: false, reason: "invalid" };

  const age = Date.now() - payload.issuedAt;
  if (age < 0 || age > OAUTH_STATE_MAX_AGE_MS) {
    return { ok: false, reason: "expired" };
  }

  const { issuedAt: _issuedAt, ...rest } = payload;
  return { ok: true, payload: rest };
}
