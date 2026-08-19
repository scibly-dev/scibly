"use client";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorFallback } from "./error-fallback";

export function ErrorBoundaryWrapper({
  children,
  title,
  retryLabel,
}: {
  children: React.ReactNode;
  title?: string;
  retryLabel?: string;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          title={title}
          retryLabel={retryLabel}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

ErrorBoundaryWrapper.displayName = "ErrorBoundaryWrapper";
