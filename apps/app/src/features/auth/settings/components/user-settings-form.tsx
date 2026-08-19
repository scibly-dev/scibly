"use client";

import type { Session } from "@scibly/auth";
import type { DictionaryPages } from "@/i18n/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { deleteUser, updateUser } from "@scibly/auth/client";
import { useLocale } from "@scibly/i18n/react";
import { routes } from "@scibly/routes";
import {
  createUpdateUserSchema,
  type UpdateUserFormValues,
} from "@scibly/schemas/user";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useUserSettingsStore } from "../user-settings-store";
import { AvatarSettingsCard } from "./avatar-settings-card";
import { DeleteAccountSettings } from "./delete-account-settings";
import { NotificationSettingCard, TextSettingCard } from "./user-setting-cards";

const authErrorSchema = z
  .object({
    status: z.number().optional(),
    code: z.string().optional(),
    message: z.string().optional(),
  })
  .catch({});

type UserUpdateMutation = {
  field: keyof UpdateUserFormValues;
  value: UpdateUserFormValues[keyof UpdateUserFormValues];
  submittedValue: UpdateUserFormValues[keyof UpdateUserFormValues];
};

type SettingsTranslations = DictionaryPages["userSettings"];
type SettingsForm = UseFormReturn<UpdateUserFormValues>;

function useUpdateSettingsMutation({
  form,
  t,
}: {
  form: SettingsForm;
  t: SettingsTranslations;
}) {
  const setStoreName = useUserSettingsStore((s) => s.setName);
  const setStoreUsername = useUserSettingsStore((s) => s.setUsername);
  return useMutation({
    mutationFn: async ({
      field,
      value,
      submittedValue,
    }: UserUpdateMutation) => {
      const data: Partial<UpdateUserFormValues> = { [field]: value };
      const result = await updateUser(data);
      if (result.error) throw result.error;
      return { field, value, submittedValue, result: result.data };
    },
    onSuccess: ({ field, value, submittedValue }) => {
      toast.success(t.savedSuccessfully);
      if (field === "name" && typeof value === "string") setStoreName(value);
      if (field === "username" && typeof value === "string") {
        setStoreUsername(value);
      }

      const currentValue = form.getValues(field);
      form.resetField(field, { defaultValue: value });
      if (!Object.is(currentValue, submittedValue)) {
        form.setValue(field, currentValue, { shouldDirty: true });
      }
    },
    onError: (error, { field }) => {
      const authError = authErrorSchema.parse(error);
      if (
        field === "username" &&
        (authError.status === 409 || authError.code === "CONFLICT")
      ) {
        toast.error(t.username.taken);
        return;
      }
      toast.error(authError.message ?? "Something went wrong");
    },
  });
}

function useDeleteAccountMutation() {
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const result = await deleteUser({});
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      router.push(routes.app.auth.default);
    },
    onError: (error) => {
      toast.error(
        authErrorSchema.parse(error).message ?? "Something went wrong",
      );
    },
  });
}

function useUserSettingsController(
  t: SettingsTranslations,
  user: Session["user"],
) {
  const locale = useLocale();
  const schema = createUpdateUserSchema(locale);
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name ?? "",
      username: user.username ?? "",
      image: user.image ?? null,
      emailNotifications: user.emailNotifications ?? false,
      marketingNotifications: user.marketingNotifications ?? false,
    },
  });
  const watchedValues = useWatch({
    control: form.control,
    name: ["image", "emailNotifications", "marketingNotifications"],
  });
  const updateMutation = useUpdateSettingsMutation({ form, t });
  const deleteMutation = useDeleteAccountMutation();

  async function saveField(field: keyof UpdateUserFormValues) {
    const isValid = await form.trigger(field);
    if (!isValid) return;
    const submittedValue = form.getValues(field);
    const parsed = schema.safeParse({ [field]: submittedValue });
    if (!parsed.success) return;
    updateMutation.mutate({
      field,
      value: parsed.data[field],
      submittedValue,
    });
  }
  function uploadImage(url: string) {
    form.setValue("image", url, { shouldDirty: true });
    updateMutation.mutate({
      field: "image",
      value: url,
      submittedValue: url,
    });
  }
  return {
    deleteMutation,
    form,
    saveField,
    updateMutation,
    uploadImage,
    watchedValues,
  };
}

export function UserSettingsForm({
  t,
  session,
}: {
  t: SettingsTranslations;
  session: Session;
}) {
  const user = session.user;
  const controller = useUserSettingsController(t, user);
  const { deleteMutation, form, saveField, updateMutation, uploadImage } =
    controller;
  const { watchedValues } = controller;
  const [imageUrl, emailNotifications, marketingNotifications] = watchedValues;
  const { dirtyFields, errors } = form.formState;
  const isPending = (field: keyof UpdateUserFormValues) =>
    updateMutation.isPending && updateMutation.variables?.field === field;

  return (
    <div className="flex w-full flex-col gap-6">
      <TextSettingCard
        {...t.name}
        saveButtonText={t.saveChanges}
        registration={form.register("name")}
        error={errors.name}
        isDirty={!!dirtyFields.name}
        isPending={isPending("name")}
        onSave={() => saveField("name")}
      />
      <TextSettingCard
        {...t.username}
        saveButtonText={t.saveChanges}
        registration={form.register("username")}
        error={errors.username}
        isDirty={!!dirtyFields.username}
        isPending={isPending("username")}
        onSave={() => saveField("username")}
      />
      <AvatarSettingsCard
        t={t}
        user={user}
        imageUrl={imageUrl}
        isDirty={!!dirtyFields.image}
        isPending={isPending("image")}
        onUploaded={uploadImage}
      />
      <NotificationSettingCard
        copy={t.emailNotifications}
        saveButtonText={t.saveChanges}
        checked={emailNotifications ?? false}
        isDirty={!!dirtyFields.emailNotifications}
        isPending={isPending("emailNotifications")}
        onSave={() => saveField("emailNotifications")}
        onCheckedChange={(checked) =>
          form.setValue("emailNotifications", checked, { shouldDirty: true })
        }
      />
      <NotificationSettingCard
        copy={t.marketingNotifications}
        saveButtonText={t.saveChanges}
        checked={marketingNotifications ?? false}
        isDirty={!!dirtyFields.marketingNotifications}
        isPending={isPending("marketingNotifications")}
        onSave={() => saveField("marketingNotifications")}
        onCheckedChange={(checked) =>
          form.setValue("marketingNotifications", checked, {
            shouldDirty: true,
          })
        }
      />
      <DeleteAccountSettings
        t={t}
        user={user}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
