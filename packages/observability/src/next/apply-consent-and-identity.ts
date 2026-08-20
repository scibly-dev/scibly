import type { PostHog } from "@posthog/react";

import { getAnalyticsConsent } from "../consent/cookie";

// Only the calls this needs: posthog hands `loaded` a narrower instance than the
// one `usePostHog()` returns, and both satisfy this.
type AnalyticsClient = Pick<
  PostHog,
  | "get_property"
  | "identify"
  | "opt_in_capturing"
  | "opt_out_capturing"
  | "reset"
>;

/** Call only from posthog's `loaded` option or an event handler — `PostHogProvider`'s own init effect runs after a component's effect, so calling this from there reaches a client with no persistence yet and silently no-ops. */
export function applyConsentAndIdentity(
  posthog: AnalyticsClient,
  userId: string | undefined,
): void {
  // No consent gate — this only clears local state — and must run before the consent calls below since `reset` wipes posthog's consent record too.
  const previous = posthog.get_property("$user_id");
  // Gated on `userId`: being signed out is not evidence someone else is now at the keyboard, so a missing session must not reset an identified browser.
  if (userId && previous && previous !== userId) {
    posthog.reset(true);
  }

  const consent = getAnalyticsConsent();
  if (consent === "granted") {
    posthog.opt_in_capturing();
  } else if (consent === "declined") {
    posthog.opt_out_capturing();
  }

  // Until consent is granted the SDK captures cookielessly — identifying here would attach a durable id to the very events that exist to avoid one.
  if (userId && consent === "granted") {
    posthog.identify(userId);
  }
}
