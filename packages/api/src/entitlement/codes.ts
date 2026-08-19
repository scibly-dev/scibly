// Kept out of entitlement/index.ts because that module is server-only, but a client surface needs to recognise these.

// The organization has started every anonymous session its plan allows this period.
export const PUBLIC_SESSIONS_EXHAUSTED =
  "entitlement.public_sessions_exhausted";

// The organization's grace period ran out; it may not generate on any endpoint, ours or its own.
export const GENERATIONS_LAPSED = "entitlement.generations_require_subscription";
