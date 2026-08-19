"use client";

import type { BillingUsageOverview } from "../../api/usage-overview.operations";
import type { OrgBillingPage } from "../../i18n/org-billing.types";
import type { Row } from "./spend-rows";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@scibly/ui/components/tabs";

import { SettingsCard } from "@/shared/ui/settings-card";

import { formatCount } from "../../format-count";
import { SpendRows } from "./spend-rows";

export function SpendBreakdownCard({
  spend,
  topupUsed,
  lang,
  t,
}: {
  spend: BillingUsageOverview["spend"];

  topupUsed: number;
  lang: string;
  t: OrgBillingPage["breakdown"];
}) {
  const n = formatCount(lang);

  const authorRows: Row[] = [
    ...spend.byAuthor.map((author, index) => ({
      key: author.actorId ?? `unattributed-${index}`,
      label: author.name ?? t.unattributed,
      credits: author.credits,
    })),
    ...(spend.otherAuthors
      ? [
          {
            key: "other-authors",
            label: t.otherAuthors.replace(
              "{authors}",
              n(spend.otherAuthors.authors),
            ),
            credits: spend.otherAuthors.credits,
          },
        ]
      : []),
  ];

  const actionRows: Row[] = spend.byAction.map((row) => ({
    key: row.action,
    label: t.actions[row.action],
    credits: row.credits,
  }));

  if (authorRows.length === 0 && actionRows.length === 0) {
    return (
      <SettingsCard title={t.title} description={t.description}>
        <p className="text-muted-foreground text-[14px]">{t.empty}</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title={t.title}
      description={t.description}
      footer={t.total.replace("{total}", n(spend.total))}
    >
      <Tabs defaultValue="author" className="w-full">
        <TabsList className="mb-5 h-auto w-full justify-start gap-1 p-1 sm:w-auto">
          {(
            [
              ["author", t.byAuthorTab],
              ["action", t.byActionTab],
            ] as const
          ).map(([tab, label]) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 px-4 py-2 sm:flex-none"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="author">
          <SpendRows rows={authorRows} creditsLabel={t.creditsColumn} n={n} />
        </TabsContent>
        <TabsContent value="action">
          <SpendRows rows={actionRows} creditsLabel={t.creditsColumn} n={n} />
        </TabsContent>
      </Tabs>
      {topupUsed > 0 ? (
        <p className="text-muted-foreground mt-4 text-[13px]">
          {t.topupNote.replace("{topup}", n(topupUsed))}
        </p>
      ) : null}
    </SettingsCard>
  );
}
