import type { AnalyticsEnv } from "./types";

import { loadPackageEnv } from "@scibly/lib/internal";
import { z } from "zod";

import {
  DEFAULT_API_HOST,
  resolveUiHost,
} from "./posthog-hosts";

export const INGEST_PATH = "/ingest";

const observabilityEnvSchema = z.object({
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
  NEXT_PUBLIC_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_POSTHOG_ENABLED: z.coerce.boolean().default(false),
});

type ObservabilityEnv = z.infer<typeof observabilityEnvSchema>;

export function loadObservabilityEnv(): ObservabilityEnv {
  const loaded = loadPackageEnv("@scibly/observability", {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_API_HOST,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? "development",
  });

  return observabilityEnvSchema.parse({
    ...loaded,
    NEXT_PUBLIC_POSTHOG_ENABLED: process.env.NEXT_PUBLIC_POSTHOG_ENABLED,
  });
}

export function getPostHogConfigFromEnv(env: ObservabilityEnv) {
  const apiHost = env.NEXT_PUBLIC_POSTHOG_HOST;

  return {
    key: env.NEXT_PUBLIC_POSTHOG_KEY,
    apiHost,
    uiHost: resolveUiHost(apiHost),
    env: env.NEXT_PUBLIC_ENV satisfies AnalyticsEnv,
  };
}
