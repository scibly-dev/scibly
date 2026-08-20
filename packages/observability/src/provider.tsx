import type { ReactNode } from "react";
import type { AnalyticsIdentity, AnalyticsSurface } from "./config/types";

import "server-only";

import { resolveObservabilityConfig } from "./config/resolve";
import { ClientObservabilityRoot } from "./next/client-root";

/** Use on surfaces that read the client through `usePostHog()`; surfaces that only autocapture should use `@scibly/observability/provider/deferred` instead, which keeps posthog-js out of the initial download. */
export async function SciblyPostHogProvider({
  surface,
  identity,
  children,
}: {
  surface: AnalyticsSurface;
  // Optional because most surfaces have no session — omitting it does not make the browser anonymous again, only signing out does.
  identity?: AnalyticsIdentity;
  children: ReactNode;
}) {
  const config = resolveObservabilityConfig();

  if (!config) {
    return children;
  }

  return (
    <ClientObservabilityRoot surface={surface} identity={identity} {...config}>
      {children}
    </ClientObservabilityRoot>
  );
}
