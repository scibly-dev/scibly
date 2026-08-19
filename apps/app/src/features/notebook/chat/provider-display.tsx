"use client";

import type React from "react";
import type { ProviderDisplayConfig } from "../workspace/utils/constants";

import { NotionLogoIcon } from "@radix-ui/react-icons";

const confluenceLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M2.3 16.3c-.3.5-.7 1.1-.9 1.5a.9.9 0 0 0 .3 1.2l3.4 2.1a.9.9 0 0 0 1.2-.3c.2-.4.6-.9.9-1.4 1.4-2.1 2.8-1.9 5.3-.7l3.3 1.6a.9.9 0 0 0 1.2-.4l1.6-3.6a.9.9 0 0 0-.4-1.2l-3.2-1.5C10 11.8 5.2 11.1 2.3 16.3Zm19.4-8.6c.3-.5.7-1.1.9-1.5a.9.9 0 0 0-.3-1.2L19 3a.9.9 0 0 0-1.2.3c-.2.4-.6.9-.9 1.4-1.4 2.1-2.8 1.9-5.3.7l-3.3-1.6a.9.9 0 0 0-1.2.4L5.5 7.8a.9.9 0 0 0 .4 1.2l3.2 1.5C14 12.2 18.8 12.9 21.7 7.7Z" />
  </svg>
);

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
  [
    "CONFLUENCE",
    {
      name: "Confluence",
      subtitle: "Browse your Confluence space and add pages as sources",
      Logo: confluenceLogo,
    },
  ],
]);

export const PROVIDER_DISPLAY_FALLBACK: ProviderDisplayConfig = {
  name: "External Source",
  subtitle: "Browse and add pages as notebook sources",
  Logo: providerLogoFallback,
};
