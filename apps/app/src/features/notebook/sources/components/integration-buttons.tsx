"use client";

import type { PageIntegrationProviderId } from "@/features/integrations/contracts";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import { ExternalLink } from "lucide-react";

import { PAGE_INTEGRATION_PROVIDERS } from "@/features/integrations/contracts";

import { PROVIDER_DISPLAY } from "../provider-display";

interface ConnectedProvider {
  provider: string;
}

interface IntegrationButtonsProps {
  connectedProviders: ConnectedProvider[];
  t: NotebookTranslations["sources"];
  onPickerOpen: (providerKey: PageIntegrationProviderId) => void;
  disabled?: boolean;
}

// Buttons come from PAGE_INTEGRATION_PROVIDERS, the connectable providers that
// actually offer pages to import — a provider connected for something else has
// nothing to show a page picker. PROVIDER_DISPLAY is cosmetic only and never
// gates which providers render — it is keyed by the same union, so every
// provider iterated here has an entry.
export function IntegrationButtons({
  connectedProviders,
  t,
  onPickerOpen,
  disabled = false,
}: IntegrationButtonsProps) {
  return (
    <>
      {PAGE_INTEGRATION_PROVIDERS.map((providerKey) => {
        const meta = PROVIDER_DISPLAY[providerKey];
        const isConnected = connectedProviders.some(
          (cp) => cp.provider === providerKey,
        );

        if (isConnected) {
          return (
            <button
              key={providerKey}
              type="button"
              disabled={disabled}
              onClick={() => onPickerOpen(providerKey)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-left transition-all hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <meta.Logo className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  {meta.name}
                </span>
                <span className="block text-[10px] text-neutral-400">
                  {t.importFrom.replace("{name}", meta.name)}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 shrink-0 text-neutral-300" />
            </button>
          );
        }

        return (
          <HoverCard key={providerKey} openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div
                role="button"
                aria-disabled="true"
                className="flex w-full cursor-default items-center gap-3 rounded-xl border border-dashed border-neutral-200 px-4 py-3 opacity-50 dark:border-neutral-800"
              >
                <meta.Logo className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {meta.name}
                  </span>
                  <span className="block text-[10px] text-neutral-400">
                    {t.importFrom.replace("{name}", meta.name)}
                  </span>
                </div>
                <ExternalLink className="h-3 w-3 shrink-0 text-neutral-200 dark:text-neutral-700" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              className="z-50 max-w-[220px] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-neutral-500 shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            >
              {t.connectIn.replace("{name}", meta.name)}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </>
  );
}
