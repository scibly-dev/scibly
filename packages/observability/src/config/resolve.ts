import { getPostHogConfigFromEnv, loadObservabilityEnv } from "./env";

export type ResolvedObservabilityConfig = {
  env: ReturnType<typeof getPostHogConfigFromEnv>["env"];
  apiKey: string;
  uiHost: string;
};

/** Null when analytics is switched off or unconfigured — callers render children bare. */
export function resolveObservabilityConfig(): ResolvedObservabilityConfig | null {
  const observabilityEnv = loadObservabilityEnv();

  if (!observabilityEnv.NEXT_PUBLIC_POSTHOG_ENABLED) {
    return null;
  }

  const config = getPostHogConfigFromEnv(observabilityEnv);

  if (!config.key) {
    return null;
  }

  return { env: config.env, apiKey: config.key, uiHost: config.uiHost };
}
