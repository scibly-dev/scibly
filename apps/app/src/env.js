import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Optional locally, required in production. `pnpm dev` has to start on a fresh
 * clone; a key missing from a deploy must still stop it.
 */
const devOptional = (schema, name) =>
  schema
    .optional()
    .refine(
      (value) => process.env.NODE_ENV !== "production" || value !== undefined,
      { message: `${name} is required in production` },
    );

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    MEDIA_BUCKET_NAME: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    RESEND_API_KEY: z.string(),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),

    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),

    OPENAI_API_KEY: devOptional(z.string(), "OPENAI_API_KEY"),
    /** 64 hex chars (32 bytes) — used for AES-256-GCM encryption of BYOAI API keys */
    ENCRYPTION_KEY: z
      .string()
      .trim()
      .regex(
        /^[0-9a-f]{64}$/i,
        "ENCRYPTION_KEY must be exactly 64 hex characters",
      ),

    /** Notion OAuth app credentials — required when using Notion integration */
    NOTION_CLIENT_ID: z.string().min(1),
    NOTION_CLIENT_SECRET: z.string().min(1),

    /** GitHub App credentials — see docs/runbooks/github-app.md */
    GITHUB_APP_SLUG: z.string().min(1),
    GITHUB_APP_ID: z.string().min(1),
    /** PEM private key; newlines may be escaped as \n for .env files. */
    GITHUB_APP_PRIVATE_KEY: z.string().min(1),
    GITHUB_APP_CLIENT_ID: z.string().min(1),
    GITHUB_APP_CLIENT_SECRET: z.string().min(1),

    AI_GATEWAY_API_KEY: z.string().min(1),
    /** Gateway model ID used when the client selects Scibly AI (scibly/default) */
    SCIBLY_DEFAULT_CHAT_MODEL: z
      .string()
      .min(1)
      .default("deepseek/deepseek-v4-flash-0731"),
    /** A cheaper tier for triage; a BYOAI org runs its one model instead. */
    SCIBLY_KNOWLEDGE_TRIAGE_MODEL: z
      .string()
      .min(1)
      .default("deepseek/deepseek-v4-flash-0731"),
    /** Gateway image model ID for notebook agent image generation */
    SCIBLY_DEFAULT_IMAGE_MODEL: z
      .string()
      .min(1)
      .default("google/gemini-3.1-flash-lite-image"),

    /** HMAC key shared only by the app token issuer and collab verifier. */
    COLLAB_TOKEN_SECRET: z.string().min(32),

    // Unset locally, Inngest talks to its own dev server on localhost:8288 and
    // signs nothing — which is exactly what `pnpm dev` wants.
    INNGEST_BASE_URL: devOptional(z.string().url(), "INNGEST_BASE_URL"),
    INNGEST_EVENT_KEY: devOptional(z.string().min(1), "INNGEST_EVENT_KEY"),
    INNGEST_SIGNING_KEY: devOptional(
      z
        .string()
        .regex(
          /^(?:[0-9a-f]{2})+$/i,
          "INNGEST_SIGNING_KEY must be bare hex with an even number of characters and no `signkey-` prefix",
        ),
      "INNGEST_SIGNING_KEY",
    ),
    /** `z.enum`, not `z.coerce.boolean()`, which reads the string `"false"` as true. */
    INNGEST_DEV: z.enum(["true", "false"]).optional(),
  },

  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_WEB_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_DOCS_URL: z.string().url(),
    NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL: z.string(),
    NEXT_PUBLIC_COLLAB_WS_URL: z.string(),
    NEXT_PUBLIC_BETA_FLAG: z.coerce.boolean().default(false),
    NEXT_PUBLIC_FREE_ACCESS_FLAG: z.coerce.boolean().default(false),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .string()
      .url()
      .default("https://eu.i.posthog.com"),
    NEXT_PUBLIC_POSTHOG_ENABLED: z.coerce.boolean().optional(),
  },

  /** Next.js edge runtimes and client code can't destructure `process.env`, so each var is listed by hand. */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    MEDIA_BUCKET_NAME: process.env.MEDIA_BUCKET_NAME,

    RESEND_API_KEY: process.env.RESEND_API_KEY,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    LOG_LEVEL: process.env.LOG_LEVEL,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

    NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID,
    NOTION_CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET,

    GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
    GITHUB_APP_CLIENT_ID: process.env.GITHUB_APP_CLIENT_ID,
    GITHUB_APP_CLIENT_SECRET: process.env.GITHUB_APP_CLIENT_SECRET,

    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    SCIBLY_DEFAULT_CHAT_MODEL: process.env.SCIBLY_DEFAULT_CHAT_MODEL,
    SCIBLY_DEFAULT_IMAGE_MODEL: process.env.SCIBLY_DEFAULT_IMAGE_MODEL,
    SCIBLY_KNOWLEDGE_TRIAGE_MODEL: process.env.SCIBLY_KNOWLEDGE_TRIAGE_MODEL,
    COLLAB_TOKEN_SECRET:
      process.env.COLLAB_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET,

    INNGEST_BASE_URL: process.env.INNGEST_BASE_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_DEV: process.env.INNGEST_DEV,

    // client side variables
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL:
      process.env.NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL,

    NEXT_PUBLIC_COLLAB_WS_URL: process.env.NEXT_PUBLIC_COLLAB_WS_URL,
    NEXT_PUBLIC_BETA_FLAG: process.env.NEXT_PUBLIC_BETA_FLAG,
    NEXT_PUBLIC_FREE_ACCESS_FLAG: process.env.NEXT_PUBLIC_FREE_ACCESS_FLAG,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_ENABLED: process.env.NEXT_PUBLIC_POSTHOG_ENABLED,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
