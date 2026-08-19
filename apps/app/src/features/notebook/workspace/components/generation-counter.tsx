"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { Sparkles } from "lucide-react";

import { api } from "@/shared/api/trpc/client";

import { notebookMutedText } from "./notebook-shell";

export function GenerationCounter({
  orgSlug,
  t,
}: {
  orgSlug: string;
  t: NotebookTranslations;
}) {
  const { data: status } = api.billing.getStatus.useQuery(
    { orgSlug },
    { enabled: Boolean(orgSlug) },
  );

  const { data } = api.billing.getGenerationBalance.useQuery(
    { orgSlug },
    {
      enabled: Boolean(orgSlug) && Boolean(status?.canManageBilling),

      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
    },
  );

  const remaining = data?.remaining ?? null;

  if (remaining === null) return null;

  const label = t.page.generationsLeft.replace(
    "{count}",
    remaining.toLocaleString(),
  );

  return (
    <span
      title={label}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium tabular-nums ${notebookMutedText}`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {remaining.toLocaleString()}
    </span>
  );
}
