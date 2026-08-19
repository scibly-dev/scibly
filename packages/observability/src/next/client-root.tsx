"use client";

export { usePostHog } from "@posthog/next";

/**
 * Analytics as an ancestor of the page, for surfaces that read the client
 * through `usePostHog()` and therefore need it present from the first render.
 * Surfaces that only autocapture use the deferred root instead.
 */
export { PostHogRoot as ClientObservabilityRoot } from "./posthog-root";
