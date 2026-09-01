"use client";

import type { KnowledgeTranslations, TopicLanguage } from "../../contracts";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";

import { TopicForm } from "./topic-form";

export function TopicDialog({
  t,
  orgSlug,
  orgId,
  defaultLanguage,
  onClose,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  orgId: string;
  defaultLanguage: TopicLanguage;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t.form.createTitle}</DialogTitle>
          <DialogDescription>{t.form.createHint}</DialogDescription>
        </DialogHeader>
        <TopicForm
          t={t}
          orgSlug={orgSlug}
          orgId={orgId}
          defaultLanguage={defaultLanguage}
          topic={null}
          onCancel={onClose}
          onSaved={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
