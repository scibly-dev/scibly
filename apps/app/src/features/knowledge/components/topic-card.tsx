import type { KnowledgeTopic, KnowledgeTranslations } from "../contracts";

import { Badge } from "@scibly/ui/components/badge";
import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";

import { TopicCardField } from "./topic-card-field";

export function TopicCard({
  topic,
  canEdit,
  onEdit,
  onDelete,
  t,
}: {
  topic: KnowledgeTopic;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  t: KnowledgeTranslations;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-ink text-base font-semibold">{topic.name}</h2>
            <Badge variant="outline">{topic.language.toUpperCase()}</Badge>
          </div>
          {canEdit ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                {t.card.edit}
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                {t.card.delete}
              </Button>
            </div>
          ) : null}
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

        {/* Both values are placeholders until the sync tickets land. */}
        <p className="text-ink-faint text-[12px]">
          {t.health.lastSync}: {t.health.never}
          {" · "}
          {t.health.pendingSuggestions.replace(
            "{count}",
            String(topic.pendingSuggestions),
          )}
        </p>
      </CardContent>
    </Card>
  );
}
