import type { ReactNode } from "react";
import type { AnalyticsSurface } from "./config/types";

import "server-only";

import { resolveObservabilityConfig } from "./config/resolve";
import { DeferredObservabilityRoot } from "./next/deferred-client-root";

/**
 * Analytics mounted beside the page after hydration, so posthog-js never enters
 * the document's script preloads. Kept in its own module because a server
 * component that referenced both roots would put posthog-js in the route's
 * client graph regardless of which one it rendered.
 *
 * Only valid where nothing calls `usePostHog()` — see {@link DeferredObservabilityRoot}.
 */
export async function DeferredSciblyPostHogProvider({
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
    <DeferredObservabilityRoot surface={surface} {...config}>
      {children}
    </DeferredObservabilityRoot>
  );
}
