import type React from "react";
import type { PageIntegrationProviderId } from "@/features/integrations/contracts";

import { NotionLogoIcon } from "@radix-ui/react-icons";

interface ProviderDisplayConfig {
  readonly name: string;

  readonly subtitle: string;

  readonly Logo: React.ComponentType<{ className?: string }>;
}

export const PROVIDER_DISPLAY = {
  NOTION: {
    name: "Notion",
    subtitle: "Browse your Notion workspace and add pages as sources",
    Logo: NotionLogoIcon,
  },
} satisfies Record<PageIntegrationProviderId, ProviderDisplayConfig>;
