import { localeCookieOptions } from "@scibly/i18n/constants";
import { getCookie, setCookie } from "cookies-next";

export const analyticsConsentCookieName = "scibly_analytics_consent";

const GRANTED = "v1";
const DECLINED = "declined";

const consentCookieOptions = {
  ...localeCookieOptions,
  maxAge: 60 * 60 * 24 * 365,
} as const;

export type ConsentStatus = "pending" | "granted" | "declined";

const listeners = new Set<() => void>();

export function setAnalyticsConsent(granted: boolean): void {
  setCookie(
    analyticsConsentCookieName,
    granted ? GRANTED : DECLINED,
    consentCookieOptions,
  );
  for (const listener of listeners) listener();
}

// Client-side only: reading via headers()/cookies() during SSR would force
// the whole route into per-request dynamic rendering.
export function getAnalyticsConsent(): ConsentStatus {
  const value = getCookie(analyticsConsentCookieName);
  if (value === GRANTED) return "granted";
  if (value === DECLINED) return "declined";
  return "pending";
}

/** The cookie is the state; components read it through `useSyncExternalStore` rather than copying it. */
export function subscribeToAnalyticsConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
