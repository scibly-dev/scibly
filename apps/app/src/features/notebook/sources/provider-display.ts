import type { ComponentType } from "react";
import type { PageIntegrationProviderId } from "@/features/integrations/contracts";

import { NotionLogoIcon } from "@radix-ui/react-icons";

export const PROVIDER_DISPLAY = {
  NOTION: {
    name: "Notion",
    subtitle: "Browse your Notion workspace and add pages as sources",
    Logo: NotionLogoIcon,
  },
} satisfies Record<
  PageIntegrationProviderId,
  {
    name: string;
    subtitle: string;
    Logo: ComponentType<{ className?: string }>;
  }
>;
