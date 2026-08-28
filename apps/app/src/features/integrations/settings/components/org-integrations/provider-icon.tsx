import type { IntegrationProviderId } from "@/features/integrations/contracts";

import { GitHubIcon } from "./github-icon";
import { NotionIcon } from "./notion-icon";

const PROVIDER_ICONS = {
  NOTION: NotionIcon,
  GITHUB: GitHubIcon,
} satisfies Record<
  IntegrationProviderId,
  React.ComponentType<{ className?: string }>
>;

export const ProviderIcon = ({
  providerId,
}: {
  providerId: IntegrationProviderId;
}) => {
  const IconComponent = PROVIDER_ICONS[providerId];
  return (
    <IconComponent className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
  );
};
