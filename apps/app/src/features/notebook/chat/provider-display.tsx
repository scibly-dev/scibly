"use client";

import type React from "react";
import type { ProviderDisplayConfig } from "../workspace/utils/constants";

import { NotionLogoIcon } from "@radix-ui/react-icons";

const providerLogoFallback: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6M9 12h6M9 15h4" />
  </svg>
);

// Add an entry here for every integration provider.
// Both SourcesPanel and IntegrationPagePicker import from this map.
export const PROVIDER_DISPLAY = new Map<string, ProviderDisplayConfig>([
  [
    "NOTION",
    {
      name: "Notion",
      subtitle: "Browse your Notion workspace and add pages as sources",
      Logo: NotionLogoIcon,
    },
  ],
]);

export const PROVIDER_DISPLAY_FALLBACK: ProviderDisplayConfig = {
  name: "External Source",
  subtitle: "Browse and add pages as notebook sources",
  Logo: providerLogoFallback,
};
