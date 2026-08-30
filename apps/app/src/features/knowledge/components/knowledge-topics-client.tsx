"use client";

import type {
  KnowledgeTopic,
  KnowledgeTranslations,
  TopicLanguage,
} from "../contracts";

import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { FeatureGateNotice } from "@/shared/ui/feature-gate-notice";

import { TopicCard } from "./topic-card";
import { TopicDialog } from "./topic-dialog";

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
  const { data, isError } = api.knowledge.list.useQuery({ orgSlug });
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

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-ink text-sm font-medium">{t.loadFailed}</p>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;
  const canWrite = data.canManage && data.access.allowed;
  const lapsed = data.access.reason === "lapsed";
  const plan = data.access.requiredPlan ?? t.gate.fallbackPlan;

  return (
    <div className="flex flex-col gap-5">
      {data.access.allowed ? null : (
        <FeatureGateNotice
          title={
            lapsed
              ? t.gate.lapsedTitle
              : t.gate.lockedTitle.replaceAll("{plan}", plan)
          }
          description={
            lapsed
              ? t.gate.lapsedDescription
              : t.gate.lockedDescription.replaceAll("{plan}", plan)
          }
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

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        title={t.deleteDialog.title}
        description={t.deleteDialog.description.replace(
          "{name}",
          pendingDelete?.name ?? "",
        )}
        cancelLabel={t.deleteDialog.cancel}
        confirmLabel={t.deleteDialog.confirm}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() =>
          pendingDelete &&
          deleteTopic.mutate({ orgSlug, topicId: pendingDelete.id })
        }
        isConfirming={deleteTopic.isPending}
      />
    </div>
  );
}
