import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_ISSUER = "scibly-app";
const TOKEN_AUDIENCE = "scibly-collab";
const TOKEN_VERSION = 1;

export type CollabRoomAccess = "read" | "write";

type CollabRoomTokenClaims = {
  version: typeof TOKEN_VERSION;
  issuer: typeof TOKEN_ISSUER;
  audience: typeof TOKEN_AUDIENCE;
  subject: string;
  name: string;
  room: string;
  access: CollabRoomAccess;
  issuedAt: number;
  expiresAt: number;
  tokenId: string;
};

type IssueCollabRoomTokenInput = {
  secret: string;
  subject: string;
  name: string;
  room: string;
  access: CollabRoomAccess;
  tokenId: string;
  ttlSeconds?: number;
  now?: Date;
};

type VerifyCollabRoomTokenInput = {
  secret: string;
  token: string;
  room: string;
  now?: Date;
};

const encode = (value: string) => Buffer.from(value).toString("base64url");

const sign = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

const assertSecret = (secret: string) => {
  if (secret.length < 32) {
    throw new Error(
      "Collaboration token secret must be at least 32 characters.",
    );
  }
};

export function issueCollabRoomToken({
  secret,
  subject,
  name,
  room,
  access,
  tokenId,
  ttlSeconds = 60,
  now = new Date(),
}: IssueCollabRoomTokenInput): string {
  assertSecret(secret);
  if (!subject || !name || !room || !tokenId) {
    throw new Error("Collaboration token claims must not be empty.");
  }
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > 300) {
    throw new Error(
      "Collaboration token lifetime must be between 1 and 300 seconds.",
    );
  }

  const issuedAt = Math.floor(now.getTime() / 1000);
  const claims: CollabRoomTokenClaims = {
    version: TOKEN_VERSION,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    subject,
    name,
    room,
    access,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
    tokenId,
  };
  const header = encode(JSON.stringify({ algorithm: "HS256", type: "JWT" }));
  const payload = encode(JSON.stringify(claims));
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifyCollabRoomToken({
  secret,
  token,
  room,
  now = new Date(),
}: VerifyCollabRoomTokenInput): CollabRoomTokenClaims {
  assertSecret(secret);
  const [header, payload, signature, extra] = token.split(".");
  if (!header || !payload || !signature || extra) {
    throw new Error("Invalid collaboration token.");
  }

  const expected = Buffer.from(sign(`${header}.${payload}`, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid collaboration token.");
  }

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid collaboration token.");
  }

  if (!isCollabRoomTokenClaims(claims) || claims.room !== room) {
    throw new Error("Invalid collaboration token.");
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (claims.expiresAt <= nowSeconds) {
    throw new Error("Collaboration token expired.");
  }
  if (claims.issuedAt > nowSeconds + 30) {
    throw new Error("Invalid collaboration token.");
  }

  return claims;
}

function isCollabRoomTokenClaims(
  value: unknown,
): value is CollabRoomTokenClaims {
  if (!value || typeof value !== "object") return false;
  // SAFETY: every field is checked below; the view only names what to look for.
  const claims = value as Partial<CollabRoomTokenClaims>;
  return (
    claims.version === TOKEN_VERSION &&
    claims.issuer === TOKEN_ISSUER &&
    claims.audience === TOKEN_AUDIENCE &&
    typeof claims.subject === "string" &&
    typeof claims.name === "string" &&
    typeof claims.room === "string" &&
    (claims.access === "read" || claims.access === "write") &&
    typeof claims.issuedAt === "number" &&
    typeof claims.expiresAt === "number" &&
    typeof claims.tokenId === "string"
  );
}
