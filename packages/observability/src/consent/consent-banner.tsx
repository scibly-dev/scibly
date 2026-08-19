"use client";

import type { ConsentLabels } from "../config/types";

import { Button } from "@scibly/ui/components/button";
import { Switch } from "@scibly/ui/components/switch";
import { useState } from "react";

export function ConsentBanner({
  labels,
  privacyPolicyHref,
  onAcceptAll,
  onNecessaryOnly,
  onSavePreferences,
}: {
  labels: ConsentLabels;
  privacyPolicyHref: string;
  onAcceptAll: () => void;
  onNecessaryOnly: () => void;
  onSavePreferences: (analyticsEnabled: boolean) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:bottom-6">
      <div
        role="dialog"
        aria-labelledby="scibly-consent-title"
        aria-describedby="scibly-consent-message"
        aria-live="polite"
        className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-4 shadow-lg md:p-5"
      >
        <h2
          id="scibly-consent-title"
          className="text-[15px] font-semibold tracking-tight text-neutral-900"
        >
          {labels.title}
        </h2>
        <p
          id="scibly-consent-message"
          className="mt-2 text-sm leading-relaxed text-neutral-700"
        >
          {labels.message}{" "}
          <a
            href={privacyPolicyHref}
            className="font-medium text-[#0066FF] underline-offset-2 hover:underline"
          >
            {labels.privacyPolicy}
          </a>
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-left text-sm font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((open) => !open)}
          >
            {showDetails ? labels.hideDetails : labels.showDetails}
          </button>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onNecessaryOnly}
            >
              {labels.necessaryOnly}
            </Button>
            <Button type="button" size="sm" onClick={onAcceptAll}>
              {labels.acceptAll}
            </Button>
          </div>
        </div>

        {showDetails ? (
          <div className="mt-4 space-y-3 border-t border-neutral-200 pt-4">
            <ConsentCategory
              title={labels.necessaryTitle}
              description={labels.necessaryDescription}
              checked
              disabled
            />
            <ConsentCategory
              title={labels.analyticsTitle}
              description={labels.analyticsDescription}
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onSavePreferences(analyticsEnabled)}
              >
                {labels.savePreferences}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConsentCategory({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
        className="mt-0.5"
      />
    </div>
  );
}
