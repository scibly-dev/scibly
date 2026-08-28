import type React from "react";
import type { PageIntegrationProviderId } from "@/features/integrations/contracts";

import { NotionLogoIcon } from "@radix-ui/react-icons";

interface ProviderDisplayConfig {
  readonly name: string;

  readonly subtitle: string;

  readonly Logo: React.ComponentType<{ className?: string }>;
}

// Only a provider a notebook can import pages from ever reaches the picker, so
// this is keyed by that union rather than by every connectable provider. The
// `satisfies` is what makes adding a page provider fail to compile until it has
// an entry — the map this replaced was keyed by bare string behind a fallback,
// which meant a missing entry rendered a blank box instead.
export const PROVIDER_DISPLAY = {
  NOTION: {
    name: "Notion",
    subtitle: "Browse your Notion workspace and add pages as sources",
    Logo: NotionLogoIcon,
  },
} satisfies Record<PageIntegrationProviderId, ProviderDisplayConfig>;
