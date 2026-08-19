import type { ReactNode } from "react";
import type { AnalyticsSurface } from "./config/types";

import "server-only";

import { resolveObservabilityConfig } from "./config/resolve";
import { ClientObservabilityRoot } from "./next/client-root";

/**
 * Analytics wrapped around the page, loaded with it. Use on surfaces that read
 * the client through `usePostHog()`. Surfaces that only autocapture should use
 * `@scibly/observability/provider/deferred` instead, which keeps posthog-js out
 * of the initial download.
 */
export async function SciblyPostHogProvider({
  surface,
  children,
}: {
  surface: AnalyticsSurface;
  children: ReactNode;
}) {
  const config = resolveObservabilityConfig();

  if (!config) {
    return children;
  }

  return (
    <ClientObservabilityRoot surface={surface} {...config}>
      {children}
    </ClientObservabilityRoot>
  );
}
