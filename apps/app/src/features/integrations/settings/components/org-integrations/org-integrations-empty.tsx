import type { OrgSettingsPage } from "@/features/organizations/contracts";

interface OrgIntegrationsEmptyProps {
  t: OrgSettingsPage["integrations"];
}

export function OrgIntegrationsEmpty({ t }: OrgIntegrationsEmptyProps) {
  return (
    <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
      {t.noProvidersAvailable}
    </p>
  );
}
