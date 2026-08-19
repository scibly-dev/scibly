import { Suspense } from "react";

import { LocalizedLoadingOverlay } from "@/shared/ui/localized-loading-overlay";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      {/* The overlay is browser-only, so nothing is lost by keeping its
          localized message out of the prerendered fallback. */}
      <Suspense fallback={null}>
        <LocalizedLoadingOverlay variant="loadingPage" />
      </Suspense>
    </div>
  );
}
