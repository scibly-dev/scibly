"use client";

import type { Session } from "@scibly/auth";
import type { DictionaryPages } from "@/i18n/types";

import { useState } from "react";

import { DeleteConfirmationModal } from "@/shared/ui/delete-confirmation-modal";
import { SettingsCard } from "@/shared/ui/settings-card";

export function DeleteAccountSettings({
  t,
  user,
  isPending,
  onConfirm,
}: {
  t: DictionaryPages["userSettings"];
  user: Session["user"];
  isPending: boolean;
  onConfirm: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <SettingsCard
        title={t.deleteAccount.title}
        description={t.deleteAccount.description}
        saveButtonText={t.deleteAccount.button}
        isDirty
        variant="destructive"
        onSave={() => setIsOpen(true)}
        isPending={isPending}
      />
      <DeleteConfirmationModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={t.deleteAccount.modal.title}
        warningText={t.deleteAccount.modal.warning}
        entityName={user.name ?? ""}
        entitySlugOrUsername={user.username ?? user.name ?? ""}
        entityImage={user.image}
        label1={t.deleteAccount.modal.label1}
        label2={t.deleteAccount.modal.label2}
        confirmText={t.deleteAccount.modal.confirmText}
        deleteButtonText={t.deleteAccount.modal.deleteButton}
        isPending={isPending}
        onConfirm={onConfirm}
      />
    </>
  );
}
