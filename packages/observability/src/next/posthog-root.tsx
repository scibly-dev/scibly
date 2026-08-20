"use client";

import type { Locale } from "@scibly/i18n/constants";
import type {
  AnalyticsEnv,
  AnalyticsIdentity,
  AnalyticsSurface,
} from "../config/types";

import { usePostHog } from "@posthog/next";
import { PostHogProvider } from "@posthog/react";
import { getLocale, localeFromPathname } from "@scibly/i18n";
import { localizedUrl, routes } from "@scibly/routes";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useSyncExternalStore } from "react";

import { POSTHOG_AUTOCAPTURE_CONFIG } from "../config/autocapture";
import { INGEST_PATH } from "../config/env";
import { withAnalyticsContext } from "../config/event-context";
import { getConsentLabels } from "../config/labels";
import { ConsentBanner } from "../consent/consent-banner";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "../consent/cookie";
import { applyConsentAndIdentity } from "./apply-consent-and-identity";

// The server cannot read the consent cookie without forcing the route into
// per-request dynamic rendering, so it renders no banner and the client decides
// after hydration.
const noConsentOnTheServer = () => undefined;

function ConsentControls({ userId }: { userId: string | undefined }) {
  const posthog = usePostHog();
  const pathname = usePathname();
  const status = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    noConsentOnTheServer,
  );

  // A click is the one moment a component can be sure posthog has initialised.
  const answer = useCallback(
    (analyticsEnabled: boolean) => {
      setAnalyticsConsent(analyticsEnabled);
      applyConsentAndIdentity(posthog, userId);
    },
    [posthog, userId],
  );

  if (status !== "pending") {
    return null;
  }

  const locale: Locale = getLocale(localeFromPathname(pathname), true);

  return (
    <ConsentBanner
      labels={getConsentLabels(locale)}
      // The policy lives on the marketing site, so both surfaces link out to it.
      privacyPolicyHref={localizedUrl(locale, routes.web.legal.datenschutz)}
      onAcceptAll={() => answer(true)}
      onNecessaryOnly={() => answer(false)}
      onSavePreferences={answer}
    />
  );
}

export type PostHogRootProps = {
  surface: AnalyticsSurface;
  env: AnalyticsEnv;
  apiKey: string;
  uiHost: string;
  identity?: AnalyticsIdentity;
  children?: ReactNode;
};

export function PostHogRoot({
  surface,
  env,
  apiKey,
  uiHost,
  identity,
  children,
}: PostHogRootProps) {
  const userId = identity?.userId;

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        api_host: INGEST_PATH,
        ui_host: uiHost,
        defaults: "2026-05-30",

        cookieless_mode: "on_reject",
        autocapture: POSTHOG_AUTOCAPTURE_CONFIG,
        capture_exceptions: false,
        capture_pageleave: true,
        capture_performance: {
          web_vitals: true,
        },
        persistence: "cookie",
        opt_out_capturing_by_default: true,

        before_send: withAnalyticsContext({ surface, env }),

        // The one callback guaranteed to run after persistence exists and before
        // the first pageview. See `applyConsentAndIdentity` for why a component
        // effect cannot stand in for it.
        loaded: (posthog) => applyConsentAndIdentity(posthog, userId),
      }}
    >
      {children}
      <ConsentControls userId={userId} />
    </PostHogProvider>
  );
}
