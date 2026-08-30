import type { KnowledgeTopic, KnowledgeTranslations } from "../contracts";

import { routes } from "@scibly/routes";
import { Badge } from "@scibly/ui/components/badge";
import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";
import Link from "next/link";

import { TopicCardField } from "./topic-card-field";

export function TopicCard({
  topic,
  orgSlug,
  canDelete,
  onDelete,
  t,
}: {
  topic: KnowledgeTopic;
  orgSlug: string;
  canDelete: boolean;
  onDelete: () => void;
  t: KnowledgeTranslations;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink text-base font-semibold">{topic.name}</h2>
            <Badge variant="outline">{topic.language.toUpperCase()}</Badge>
            {topic.externallyEditedAt ? (
              <Badge variant="outline" title={t.card.externallyEditedHint}>
                {t.card.externallyEdited}
              </Badge>
            ) : null}
            {topic.documentUrl ? (
              <a
                href={topic.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ink-muted hover:text-ink text-[13px] underline underline-offset-2"
              >
                {t.card.openDocument}
              </a>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={routes.app.profile.org(orgSlug).knowledge.topic(topic.id)}
              >
                {t.card.open}
              </Link>
            </Button>
            {canDelete ? (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                {t.card.delete}
              </Button>
            ) : null}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <TopicCardField label={t.card.repositories}>
            {topic.repositories.map((repo) => (
              <div key={repo.id} className="truncate" title={repo.fullName}>
                {repo.fullName}
                {repo.pathGlobs.length > 0 ? (
                  <span className="text-ink-faint">
                    {" — "}
                    {repo.pathGlobs.join(", ")}
                  </span>
                ) : null}
              </div>
            ))}
          </TopicCardField>
          <TopicCardField label={t.card.maintainers}>
            {topic.maintainers.length > 0
              ? topic.maintainers
                  .map((maintainer) => maintainer.name || maintainer.email)
                  .join(", ")
              : t.card.noMaintainers}
          </TopicCardField>
        </dl>

        {/* pendingSuggestions stays a placeholder until suggestions land. */}
        <p className="text-ink-faint text-[12px]">
          {t.health.pendingSuggestions.replace(
            "{count}",
            String(topic.pendingSuggestions),
          )}
        </p>
      </CardContent>
    </Card>
  );
}
