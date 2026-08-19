"use client";

import type { Locale } from "@scibly/i18n/constants";
import type {
  AnalyticsEnv,
  AnalyticsSurface,
  ConsentLabels,
} from "../config/types";

import { usePostHog } from "@posthog/next";
import { PostHogProvider } from "@posthog/react";
import { getLocale, localeFromPathname } from "@scibly/i18n";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { POSTHOG_AUTOCAPTURE_CONFIG } from "../config/autocapture";
import { INGEST_PATH } from "../config/env";
import { getConsentLabels } from "../config/labels";
import { ConsentBanner } from "../consent/consent-banner";
import {
  type ConsentStatus,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from "../consent/cookie";

// The server can't read the consent cookie without forcing per-request
// dynamic rendering, so PostHog always inits opted-out and this corrects
// it client-side on mount for returning users.
function ConsentSync({
  setStatus,
}: {
  setStatus: (status: ConsentStatus) => void;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    const resolved = getAnalyticsConsent();
    if (resolved === "granted") {
      posthog.opt_in_capturing();
    } else if (resolved === "declined") {
      posthog.opt_out_capturing();
    }
    setStatus(resolved);
  }, [posthog, setStatus]);

  return null;
}

// Registered globally, not passed per capture call, so autocaptured events carry these properties too.
function SuperProperties({
  surface,
  env,
}: {
  surface: AnalyticsSurface;
  env: AnalyticsEnv;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    posthog.register({ surface, env });
  }, [env, posthog, surface]);

  return null;
}

function ConsentControls({
  status,
  setStatus,
  labels,
  locale,
  surface,
}: {
  status: ConsentStatus | undefined;
  setStatus: (status: ConsentStatus) => void;
  labels: ConsentLabels;
  locale: Locale;
  surface: AnalyticsSurface;
}) {
  const posthog = usePostHog();

  const acceptConsent = useCallback(() => {
    setAnalyticsConsent(true);
    posthog.opt_in_capturing();
    setStatus("granted");
  }, [posthog, setStatus]);

  const rejectConsent = useCallback(() => {
    setAnalyticsConsent(false);
    posthog.opt_out_capturing();
    setStatus("declined");
  }, [posthog, setStatus]);

  const savePreferences = useCallback(
    (analyticsEnabled: boolean) => {
      if (analyticsEnabled) {
        acceptConsent();
        return;
      }
      rejectConsent();
    },
    [acceptConsent, rejectConsent],
  );

  if (status !== "pending") {
    return null;
  }

  const webOrigin = process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "");
  const privacyPolicyHref =
    surface === "app" && webOrigin
      ? `${webOrigin}/${locale}/datenschutz`
      : `/${locale}/datenschutz`;

  return (
    <ConsentBanner
      labels={labels}
      privacyPolicyHref={privacyPolicyHref}
      onAcceptAll={acceptConsent}
      onNecessaryOnly={rejectConsent}
      onSavePreferences={savePreferences}
    />
  );
}

export type PostHogRootProps = {
  surface: AnalyticsSurface;
  env: AnalyticsEnv;
  apiKey: string;
  uiHost: string;
  children?: ReactNode;
};

export function PostHogRoot({
  surface,
  env,
  apiKey,
  uiHost,
  children,
}: PostHogRootProps) {
  // Undefined until ConsentSync reads the cookie. Starting at "pending" would
  // render the banner server-side and flash it at everyone who already
  // answered, since the server cannot see the cookie.
  const [status, setStatus] = useState<ConsentStatus>();
  const pathname = usePathname();
  const locale: Locale = getLocale(localeFromPathname(pathname), true);
  const labels = getConsentLabels(locale);

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
      }}
    >
      <ConsentSync setStatus={setStatus} />
      <SuperProperties surface={surface} env={env} />
      {children}
      <ConsentControls
        status={status}
        setStatus={setStatus}
        labels={labels}
        locale={locale}
        surface={surface}
      />
    </PostHogProvider>
  );
}
