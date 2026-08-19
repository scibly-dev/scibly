process.env.SKIP_ENV_VALIDATION = "true";
process.env.RESEND_API_KEY = "test_key";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test_secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_WEB_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL = "http://localhost:8000";
process.env.NEXT_PUBLIC_DOCS_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_ENV = "test";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
// A throwaway 32-byte key in hex. Nothing encrypted with it ever leaves a test.
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.NOTION_CLIENT_ID = "test-notion-client";
process.env.NOTION_CLIENT_SECRET = "test-notion-secret";
process.env.STRIPE_SECRET_KEY = "sk_test_stub";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_stub";
process.env.STRIPE_PRICE_STARTER = "price_test_starter";
process.env.STRIPE_PRICE_BUSINESS = "price_test_business";
process.env.STRIPE_PRICE_PRO = "price_test_pro";
process.env.STRIPE_PRICE_TOPUP_SMALL = "price_test_topup_small";
process.env.STRIPE_PRICE_TOPUP_LARGE = "price_test_topup_large";
process.env.STRIPE_PRICE_SEAT_STARTER = "price_test_seat_starter";
process.env.STRIPE_PRICE_SEAT_BUSINESS = "price_test_seat_business";
process.env.STRIPE_PRICE_SEAT_PRO = "price_test_seat_pro";
process.env.STRIPE_PORTAL_CONFIGURATION_ID = "bpc_test_stub";
// Collab server env vars (needed when importing from apps/collab/src)
process.env.COLLAB_PORT = "3001";
process.env.COLLAB_TRUST_PROXY = "false";
process.env.COLLAB_FLUSH_INTERVAL_MS = "500";
process.env.COLLAB_CLEANUP_INTERVAL_MS = "300000";
process.env.COLLAB_TOKEN_SECRET = "test-collab-token-secret-32-bytes-minimum";

import { ReadableStream } from "stream/web";
import { TextDecoder, TextEncoder } from "util";
import { vi } from "vitest";
import { MessageChannel, MessagePort } from "worker_threads";

// Polyfill Web APIs for Node.js/jsdom test environment
// @ts-expect-error - ReadableStream is available in Node.js 18+ from stream/web
global.ReadableStream = ReadableStream;
// Node's versions of these differ nominally from the DOM lib's, so they are
// installed by assignment rather than by asserting the two are the same type.
Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  MessageChannel,
  MessagePort,

  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// The SSRF guard resolves every host it is asked about, so DNS is stubbed to one
// public address for every name; a test that cares mocks this module itself.
const dns = {
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
};
vi.mock("node:dns/promises", () => ({ ...dns, default: dns }));

// Rejects so an unmocked fetch fails loudly instead of silently succeeding with
// nothing; mock global.fetch in the test that needs it.
global.fetch = vi.fn((input: RequestInfo | URL): Promise<Response> => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return Promise.reject(
    new Error(
      `Unmocked fetch to ${url} — tests never touch the network. ` +
        `Double this call at its seam, or stub global.fetch in this file's test.`,
    ),
  );
});
