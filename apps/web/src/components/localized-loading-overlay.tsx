"use client";

import { LoadingOverlay } from "@scibly/ui/components/loading-overlay";

import { type AppRouteLoadingVariant } from "@/app/[lang]/i18n/app-routes.types";
import { useTranslation } from "@/i18n/hooks/use-translation";

const FALLBACK = {
  loadingPage: "Seite wird geladen...",
  loadingEditor: "Editor wird geladen...",
  loadingWorksheet: "Arbeitsblatt wird geladen...",
  loadingWorksheets: "Arbeitsblätter werden geladen...",
  loadingSettings: "Einstellungen werden geladen...",
} satisfies Record<AppRouteLoadingVariant, string>;

type LocalizedLoadingOverlayProps = {
  variant: AppRouteLoadingVariant;
};

export const LocalizedLoadingOverlay = ({
  variant,
}: LocalizedLoadingOverlayProps) => {
  const { translations } = useTranslation("appRoutes");
  if (!translations) {
    return <LoadingOverlay message={FALLBACK[variant]} />;
  }
  return <LoadingOverlay message={translations[variant]} />;
};
