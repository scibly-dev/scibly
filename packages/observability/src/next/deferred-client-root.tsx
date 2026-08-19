"use client";

import type { PostHogRootProps } from "./posthog-root";

import { lazy, Suspense, useEffect, useState } from "react";

// posthog-js is the heaviest asset on any page that loads it. Reaching it only
// through a dynamic import keeps it out of the document's script preloads, so
// it downloads after first paint instead of competing with the page's own HTML
// and hero image on a slow connection.
const PostHogRoot = lazy(() =>
  import("./posthog-root").then((m) => ({ default: m.PostHogRoot })),
);

/**
 * Analytics as a sibling of the page, mounted after hydration. Valid only where
 * nothing calls `usePostHog()` — autocapture attaches its listeners whenever
 * PostHog initialises, so late mounting costs nothing there.
 */
export function DeferredObservabilityRoot({
  children,
  ...props
}: PostHogRootProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Idle rather than immediate, where the browser offers it, so the import
    // waits for a gap in the main thread instead of racing the page's own
    // post-hydration work. Safari has no requestIdleCallback.
    if (typeof requestIdleCallback === "function") {
      const handle = requestIdleCallback(() => setMounted(true), {
        timeout: 2000,
      });
      return () => cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(() => setMounted(true));
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <>
      {children}
      {mounted ? (
        <Suspense>
          <PostHogRoot {...props} />
        </Suspense>
      ) : null}
    </>
  );
}
