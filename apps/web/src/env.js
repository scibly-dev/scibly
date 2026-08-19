import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET: z.string(),

    AWS_REGION: z.string(),
    MEDIA_BUCKET_NAME: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    RESEND_API_KEY: z.string(),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),

    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
  },

  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_WEB_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_DOCS_URL: z.string().url(),
    NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL: z.string(),
    NEXT_PUBLIC_BETA_FLAG: z.coerce.boolean().default(false),
    NEXT_PUBLIC_FREE_ACCESS_FLAG: z.coerce.boolean().default(false),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .string()
      .url()
      .default("https://eu.i.posthog.com"),
    NEXT_PUBLIC_POSTHOG_ENABLED: z.coerce.boolean().optional(),
  },

  // You can't destructure `process.env` as a regular object in the Next.js edge runtimes (e.g. middlewares) or client-side, so it's listed manually below.
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,

    AWS_REGION: process.env.AWS_REGION,
    MEDIA_BUCKET_NAME: process.env.MEDIA_BUCKET_NAME,

    RESEND_API_KEY: process.env.RESEND_API_KEY,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    LOG_LEVEL: process.env.LOG_LEVEL,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // client side variables
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL:
      process.env.NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL,

    NEXT_PUBLIC_BETA_FLAG: process.env.NEXT_PUBLIC_BETA_FLAG,
    NEXT_PUBLIC_FREE_ACCESS_FLAG: process.env.NEXT_PUBLIC_FREE_ACCESS_FLAG,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_ENABLED: process.env.NEXT_PUBLIC_POSTHOG_ENABLED,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
