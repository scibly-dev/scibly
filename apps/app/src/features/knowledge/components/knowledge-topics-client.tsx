"use client";

import type {
  KnowledgeTopic,
  KnowledgeTranslations,
  TopicLanguage,
} from "../contracts";

import { Badge } from "@scibly/ui/components/badge";
import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { Lock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { TopicDialog } from "./topic-dialog";

function GateNotice({
  reason,
  requiredPlan,
  t,
}: {
  reason: string;
  requiredPlan: string | null;
  t: KnowledgeTranslations;
}) {
  const lapsed = reason === "lapsed";
  const plan = requiredPlan ?? t.gate.fallbackPlan;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-[13px] font-medium">
          {lapsed
            ? t.gate.lapsedTitle
            : t.gate.lockedTitle.replaceAll("{plan}", plan)}
        </p>
        <p className="text-[12px] leading-relaxed">
          {lapsed
            ? t.gate.lapsedDescription
            : t.gate.lockedDescription.replaceAll("{plan}", plan)}
        </p>
      </div>
    </div>
  );
}

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <dt className="text-ink-faint text-[11px] font-semibold tracking-wider uppercase">
      {label}
    </dt>
    <dd className="text-ink-muted mt-0.5 text-[13px]">{children}</dd>
  </div>
);

function TopicCard({
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
          <Field label={t.card.repositories}>
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
          </Field>
          <Field label={t.card.maintainers}>
            {topic.maintainers.length > 0
              ? topic.maintainers
                  .map((maintainer) => maintainer.name || maintainer.email)
                  .join(", ")
              : t.card.noMaintainers}
          </Field>
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

export function KnowledgeTopicsClient({
  t,
  orgSlug,
  defaultLanguage,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  defaultLanguage: TopicLanguage;
}) {
  const utils = api.useUtils();
  const { data } = api.knowledge.list.useQuery({ orgSlug });
  // `null` opens the dialog for a new topic; a topic opens it for that one.
  const [editing, setEditing] = useState<KnowledgeTopic | null | undefined>(
    undefined,
  );
  const [pendingDelete, setPendingDelete] = useState<KnowledgeTopic | null>(
    null,
  );

  const deleteTopic = api.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success(t.deleteDialog.deleted);
      void utils.knowledge.list.invalidate({ orgSlug });
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setPendingDelete(null),
  });

  if (!data) return null;
  const canWrite = data.canManage && data.access.allowed;

  return (
    <div className="flex flex-col gap-5">
      {data.access.allowed ? null : (
        <GateNotice
          reason={data.access.reason ?? ""}
          requiredPlan={data.access.requiredPlan}
          t={t}
        />
      )}

      {canWrite ? (
        <div>
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" />
            {t.newTopic}
          </Button>
        </div>
      ) : null}

      {data.topics.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-ink text-sm font-medium">{t.empty.title}</p>
            <p className="text-ink-muted mt-1 text-[13px]">
              {t.empty.description}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              canEdit={canWrite}
              onEdit={() => setEditing(topic)}
              onDelete={() => setPendingDelete(topic)}
              t={t}
            />
          ))}
        </div>
      )}

      {editing === undefined ? null : (
        <TopicDialog
          t={t}
          orgSlug={orgSlug}
          orgId={data.organizationId}
          defaultLanguage={defaultLanguage}
          topic={editing}
          onClose={() => setEditing(undefined)}
        />
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.deleteDialog.title}</DialogTitle>
            <DialogDescription>
              {t.deleteDialog.description.replace(
                "{name}",
                pendingDelete?.name ?? "",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t.deleteDialog.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTopic.isPending}
              onClick={() =>
                pendingDelete &&
                deleteTopic.mutate({ orgSlug, topicId: pendingDelete.id })
              }
            >
              {t.deleteDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
