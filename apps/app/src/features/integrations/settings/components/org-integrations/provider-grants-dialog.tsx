"use client";

import type { IntegrationGrant } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { ExternalLink } from "lucide-react";

import { ScrollArea } from "@/shared/ui/components/scroll-area";

export function ProviderGrantsDialog({
  open,
  onOpenChange,
  grants,
  totalCount,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grants: IntegrationGrant[];
  totalCount: number;
  t: OrgSettingsPage["integrations"];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.grantsTitle}</DialogTitle>
          <DialogDescription>
            {t.grantsShown
              .replace("{shown}", String(grants.length))
              .replace("{total}", String(totalCount))}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh]">
          <ul className="flex flex-col gap-1 pr-3">
            {grants.map((grant) => (
              <li key={grant.id}>
                <a
                  href={grant.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {grant.name}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
