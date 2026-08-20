/** The part of a posthog event this touches, kept structural so shaping an event does not pull in the SDK's types. Properties are only ever added to, never read. */
type OutgoingEvent = { event: string; properties: object };

/** Module state shared by every request a server instance is handling at once — write only from an effect or event handler, never during render, or one user's organization silently lands on another user's events. */
let context: Record<string, string> = {};

/** Replaces the whole set, so leaving an organization drops its properties too. */
export function setAnalyticsContext(next: Record<string, string>): void {
  context = next;
}

/** Config rather than super properties, which posthog clears on every `reset()` — including the ones cookieless mode triggers on its own — and re-registering them would need something watching for that. */
export function withAnalyticsContext(fixed: Record<string, string>) {
  // Runs on every event including autocaptured ones, so it must never throw.
  return <T extends OutgoingEvent>(event: T | null): T | null => {
    // $snapshot is a session-recording payload, which posthog documents as unsafe to edit.
    if (event?.properties && event.event !== "$snapshot") {
      Object.assign(event.properties, fixed, context);
    }
    return event;
  };
}
