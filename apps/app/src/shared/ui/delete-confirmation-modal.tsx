"use client";

import { getInitials } from "@scibly/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { Input } from "@scibly/ui/components/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  warningText: string;
  entityName: string;
  entitySlugOrUsername: string;
  entityImage?: string | null;
  label1: string;
  label2: string;
  confirmText: string;
  deleteButtonText: string;
  isPending: boolean;
  onConfirm: () => void;
};

export const SlugConfirmationLabel = ({
  entitySlugOrUsername,
  label,
}: {
  entitySlugOrUsername: string;
  label: string;
}) => {
  const parts = label.split(/{slug}|{username}/);
  return (
    <>
      {parts[0]}
      {parts.length > 1 ? (
        <span className="font-semibold">{entitySlugOrUsername}</span>
      ) : null}
      {parts[1]}
    </>
  );
};

export const TextConfirmationLabel = ({
  confirmText,
  label,
}: {
  confirmText: string;
  label: string;
}) => {
  const parts = label.split(confirmText);
  if (parts.length === 1) return label;

  return (
    <>
      {parts[0]}
      <span className="font-semibold">{confirmText}</span>
      {parts[1]}
    </>
  );
};

export const EntitySummary = ({
  entityImage,
  entityName,
  entitySlugOrUsername,
}: Pick<
  DeleteConfirmationModalProps,
  "entityImage" | "entityName" | "entitySlugOrUsername"
>) => {
  return (
    <div className="flex items-center gap-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <Avatar className="h-10 w-10 border border-neutral-200 dark:border-neutral-800">
        <AvatarImage src={entityImage || ""} />
        <AvatarFallback className="bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
          {getInitials(entityName)[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {entityName}
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {entitySlugOrUsername}
        </span>
      </div>
    </div>
  );
};

export const ConfirmationField = ({
  children,
  onChange,
  value,
}: {
  children: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-neutral-700 dark:text-neutral-300">
        {children}
      </label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-neutral-50 dark:bg-neutral-900"
      />
    </div>
  );
};

export function DeleteConfirmationModal(props: DeleteConfirmationModalProps) {
  const {
    confirmText,
    deleteButtonText,
    entitySlugOrUsername,
    isOpen,
    isPending,
    label1,
    label2,
    onConfirm,
    onOpenChange,
    title,
    warningText,
  } = props;
  const [slugInput, setSlugInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const isFormValid =
    slugInput === entitySlugOrUsername && confirmInput === confirmText;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setSlugInput("");
        setConfirmInput("");
      }, 200);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400">
            {warningText}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <EntitySummary
            entityImage={props.entityImage}
            entityName={props.entityName}
            entitySlugOrUsername={entitySlugOrUsername}
          />
          <ConfirmationField value={slugInput} onChange={setSlugInput}>
            <SlugConfirmationLabel
              label={label1}
              entitySlugOrUsername={entitySlugOrUsername}
            />
          </ConfirmationField>
          <ConfirmationField value={confirmInput} onChange={setConfirmInput}>
            <TextConfirmationLabel label={label2} confirmText={confirmText} />
          </ConfirmationField>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="destructive"
            className="w-full border border-red-200 bg-red-50 text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-500 dark:hover:bg-red-900/20"
            disabled={!isFormValid || isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {deleteButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
