"use client";

import type { Session } from "@scibly/auth";
import type { DictionaryPages } from "@/i18n/types";

import { getInitials } from "@scibly/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { Popover, PopoverTrigger } from "@scibly/ui/components/popover";

import FileUploadInput from "@/shared/content/editor/media/components/file-upload-input-popover";
import { SettingsCard } from "@/shared/ui/settings-card";

export function AvatarSettingsCard({
  t,
  user,
  imageUrl,
  isDirty,
  isPending,
  onUploaded,
}: {
  t: DictionaryPages["userSettings"];
  user: Session["user"];
  imageUrl: string | null | undefined;
  isDirty: boolean;
  isPending: boolean;
  onUploaded: (url: string) => void;
}) {
  return (
    <SettingsCard
      title={t.avatar.title}
      description={
        <span className="flex flex-col gap-1">
          <span>{t.avatar.description}</span>
          <span>{t.avatar.uploadText}</span>
        </span>
      }
      footer={t.avatar.footer}
      isDirty={isDirty}
      isPending={isPending}
      contentLayout="row"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Avatar className="ring-offset-background h-16 w-16 cursor-pointer text-xl transition-all hover:ring-2 hover:ring-neutral-400 hover:ring-offset-2 dark:hover:ring-neutral-500">
            <AvatarImage src={imageUrl || user.image || ""} />
            <AvatarFallback>{getInitials(user.name)[0]}</AvatarFallback>
          </Avatar>
        </PopoverTrigger>
        <FileUploadInput
          mediaType="image"
          useEditorBucket={false}
          setLoading={() => {}}
          setNewUrl={onUploaded}
          hideUploadTab={false}
        />
      </Popover>
    </SettingsCard>
  );
}
