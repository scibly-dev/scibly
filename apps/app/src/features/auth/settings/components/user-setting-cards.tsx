import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import type { DictionaryPages } from "@/i18n/types";

import { Input } from "@scibly/ui/components/input";
import { Switch } from "@scibly/ui/components/switch";

import { SettingsCard } from "@/shared/ui/settings-card";

type SettingsTranslations = DictionaryPages["userSettings"];

export function TextSettingCard({
  title,
  description,
  footer,
  saveButtonText,
  registration,
  error,
  isDirty,
  isPending,
  onSave,
}: {
  title: string;
  description: string;
  footer: string;
  saveButtonText: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  isDirty: boolean;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <SettingsCard
      title={title}
      description={description}
      footer={footer}
      saveButtonText={saveButtonText}
      isDirty={isDirty}
      isPending={isPending}
      onSave={onSave}
    >
      <div className="flex flex-col gap-2">
        <Input {...registration} maxLength={32} className="max-w-md" />
        {error ? (
          <span className="text-sm text-red-500">{error.message}</span>
        ) : null}
      </div>
    </SettingsCard>
  );
}

export function NotificationSettingCard({
  copy,
  saveButtonText,
  checked,
  isDirty,
  isPending,
  onCheckedChange,
  onSave,
}: {
  copy: SettingsTranslations["emailNotifications"];
  saveButtonText: string;
  checked: boolean;
  isDirty: boolean;
  isPending: boolean;
  onCheckedChange: (checked: boolean) => void;
  onSave: () => void;
}) {
  return (
    <SettingsCard
      title={copy.title}
      description={copy.description}
      footer={copy.footer}
      saveButtonText={saveButtonText}
      isDirty={isDirty}
      isPending={isPending}
      onSave={onSave}
    >
      <div className="flex items-center gap-2">
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </SettingsCard>
  );
}
