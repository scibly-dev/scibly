import type {
  Org,
  OrgForm,
  OrgSettingsController,
  OrgSettingsTranslations,
} from "./org-settings-form";

import { getInitials } from "@scibly/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { Input } from "@scibly/ui/components/input";
import { Popover, PopoverTrigger } from "@scibly/ui/components/popover";

import FileUploadInput from "@/shared/content/editor/media/components/file-upload-input-popover";
import { DeleteConfirmationModal } from "@/shared/ui/delete-confirmation-modal";
import { SettingsCard } from "@/shared/ui/settings-card";

export function OrgTextSetting({
  copy,
  field,
  maxLength,
  form,
  isPending,
  saveButtonText,
  onSave,
}: {
  copy: OrgSettingsTranslations["name"];
  field: "name" | "slug";
  maxLength: number;
  form: OrgForm;
  isPending: boolean;
  saveButtonText: string;
  onSave: () => void;
}) {
  const error = form.formState.errors[field];
  return (
    <SettingsCard
      title={copy.title}
      description={copy.description}
      footer={copy.footer}
      saveButtonText={saveButtonText}
      isDirty={!!form.formState.dirtyFields[field]}
      isPending={isPending}
      onSave={onSave}
    >
      <div className="flex flex-col gap-2">
        <Input
          {...form.register(field)}
          maxLength={maxLength}
          className="max-w-md"
        />
        {error ? (
          <span className="text-sm text-red-500">{error.message}</span>
        ) : null}
      </div>
    </SettingsCard>
  );
}

export function OrganizationLogoSetting({
  controller,
  org,
  t,
}: {
  controller: OrgSettingsController;
  org: Org;
  t: OrgSettingsTranslations;
}) {
  return (
    <SettingsCard
      title={t.logo.title}
      description={
        <span className="flex flex-col gap-1">
          <span>{t.logo.description}</span>
          <span>{t.logo.uploadText}</span>
        </span>
      }
      footer={t.logo.footer}
      isDirty={!!controller.form.formState.dirtyFields.logo}
      isPending={
        controller.updateMutation.isPending &&
        !!controller.form.formState.dirtyFields.logo
      }
      contentLayout="row"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Avatar className="ring-offset-background h-16 w-16 cursor-pointer text-xl transition-all hover:ring-2 hover:ring-neutral-400 hover:ring-offset-2 dark:hover:ring-neutral-500">
            <AvatarImage src={controller.logoUrl || org.logo || ""} />
            <AvatarFallback>{getInitials(org.name)[0]}</AvatarFallback>
          </Avatar>
        </PopoverTrigger>
        <FileUploadInput
          mediaType="image"
          useEditorBucket={false}
          setLoading={() => {}}
          setNewUrl={controller.uploadLogo}
          hideUploadTab={false}
        />
      </Popover>
    </SettingsCard>
  );
}

export function DeleteOrganizationSetting({
  controller,
  org,
  t,
}: {
  controller: OrgSettingsController;
  org: Org;
  t: OrgSettingsTranslations;
}) {
  return (
    <>
      <SettingsCard
        title={t.deleteOrganization.title}
        description={t.deleteOrganization.description}
        saveButtonText={t.deleteOrganization.button}
        isDirty={true}
        variant="destructive"
        onSave={() => controller.setIsDeleteModalOpen(true)}
        isPending={controller.deleteMutation.isPending}
      />
      <DeleteConfirmationModal
        isOpen={controller.isDeleteModalOpen}
        onOpenChange={controller.setIsDeleteModalOpen}
        title={t.deleteOrganization.modal.title}
        warningText={t.deleteOrganization.modal.warning}
        entityName={org.name}
        entitySlugOrUsername={org.slug ?? ""}
        entityImage={org.logo}
        label1={t.deleteOrganization.modal.label1}
        label2={t.deleteOrganization.modal.label2}
        confirmText={t.deleteOrganization.modal.confirmText}
        deleteButtonText={t.deleteOrganization.modal.deleteButton}
        isPending={controller.deleteMutation.isPending}
        onConfirm={() =>
          controller.deleteMutation.mutate({ organizationId: org.id })
        }
      />
    </>
  );
}
