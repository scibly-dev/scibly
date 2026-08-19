"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { z } from "zod";
import type { IntegrationCallbackError } from "@/features/integrations/contracts";
import type { DictionaryPages } from "@/i18n/types";
import type { AppRouter } from "@/server/api/root";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  INTEGRATION_CONNECTED_QUERY_PARAM,
  INTEGRATION_ERROR_QUERY_PARAM,
  routes,
} from "@scibly/routes";
import { updateOrganizationSchema } from "@scibly/schemas/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OrgIntegrationsCard } from "@/features/integrations/client";
import { INTEGRATION_CALLBACK_ERRORS } from "@/features/integrations/contracts";
import { api } from "@/shared/api/trpc/client";

import { OrgAIConfigCard } from "./org-ai-config-card";
import {
  DeleteOrganizationSetting,
  OrganizationLogoSetting,
  OrgTextSetting,
} from "./org-settings-cards";

export type Org = NonNullable<
  inferRouterOutputs<AppRouter>["organization"]["getBySlug"]
>;
type UpdateOrgFormValues = z.infer<typeof updateOrganizationSchema>;
export type OrgSettingsTranslations = DictionaryPages["orgSettings"];
export type OrgForm = UseFormReturn<UpdateOrgFormValues>;

function useOAuthResultNotifications(
  integrationConnected?: string,
  integrationError?: string,
) {
  const router = useRouter();
  const trpcUtils = api.useUtils();
  useEffect(() => {
    const url = new URL(window.location.href);
    if (integrationConnected) {
      toast.success(
        `${integrationConnected.toUpperCase()} connected successfully.`,
      );
      void trpcUtils.integration.list.invalidate();
      url.searchParams.delete(INTEGRATION_CONNECTED_QUERY_PARAM);
      router.replace(url.pathname + url.search);
      return;
    }
    if (!integrationError) return;

    const messages = {
      provider_denied: "Access denied. You cancelled the authorization.",
      provider_error: "The provider rejected the connection. Please try again.",
      missing_params: "The connection link was incomplete. Please try again.",
      invalid_state: "Invalid OAuth state. Please try again.",
      expired_state: "The connection link expired. Please try again.",
      state_mismatch: "OAuth state mismatch. Please try again.",
      session_mismatch:
        "You are signed in as a different user than the one who started the connection.",
      org_not_found: "Organization not found.",
      forbidden: "You need to be an admin or owner to connect an integration.",
      token_exchange_failed:
        "Connection failed. Check that your redirect URI is registered in Notion.",
    } satisfies Record<IntegrationCallbackError, string>;
    const known = INTEGRATION_CALLBACK_ERRORS.find(
      (code) => code === integrationError,
    );
    toast.error(
      known ? messages[known] : "Connection failed. Please try again.",
    );
    url.searchParams.delete(INTEGRATION_ERROR_QUERY_PARAM);
    router.replace(url.pathname + url.search);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function useOrganizationMutations(
  form: OrgForm,
  org: Org,
  t: OrgSettingsTranslations,
) {
  const router = useRouter();
  const trpcUtils = api.useUtils();
  const updateMutation = api.organization.update.useMutation({
    onSuccess: (updatedOrg) => {
      toast.success(t.savedSuccessfully);
      form.reset({
        organizationId: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug ?? "",
        logo: updatedOrg.logo ?? undefined,
      });
      void trpcUtils.organization.listMyOrgs.invalidate();
      if (updatedOrg.slug !== org.slug) {
        router.push(routes.app.profile.org(updatedOrg.slug).settings);
      }
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = api.organization.delete.useMutation({
    onSuccess: () => {
      toast.success(t.savedSuccessfully);
      void trpcUtils.organization.listMyOrgs.invalidate();
      router.push(routes.app.profile.default);
    },
    onError: (error) => toast.error(error.message),
  });
  return { deleteMutation, updateMutation };
}

function useOrgSettingsController(t: OrgSettingsTranslations, org: Org) {
  const form = useForm<UpdateOrgFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      organizationId: org.id,
      name: org.name,
      slug: org.slug ?? "",
      logo: org.logo ?? undefined,
    },
  });
  const logoUrl = useWatch({ control: form.control, name: "logo" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { deleteMutation, updateMutation } = useOrganizationMutations(
    form,
    org,
    t,
  );
  const saveField = async (field: keyof UpdateOrgFormValues) => {
    if (!(await form.trigger(field))) return;
    updateMutation.mutate({
      organizationId: org.id,
      [field]: form.getValues(field),
    });
  };
  const uploadLogo = (url: string) => {
    form.setValue("logo", url, { shouldDirty: true });
    updateMutation.mutate({ organizationId: org.id, logo: url });
  };
  return {
    deleteMutation,
    form,
    isDeleteModalOpen,
    logoUrl,
    saveField,
    setIsDeleteModalOpen,
    updateMutation,
    uploadLogo,
  };
}

export type OrgSettingsController = ReturnType<typeof useOrgSettingsController>;

export function OrgSettingsForm({
  t,
  org,
  lang,
  integrationConnected,
  integrationError,
}: {
  t: OrgSettingsTranslations;
  org: Org;
  lang: string;
  integrationConnected?: string;
  integrationError?: string;
}) {
  useOAuthResultNotifications(integrationConnected, integrationError);
  const controller = useOrgSettingsController(t, org);
  const { dirtyFields } = controller.form.formState;
  return (
    <div className="flex w-full flex-col gap-6">
      <OrgTextSetting
        copy={t.name}
        field="name"
        maxLength={100}
        form={controller.form}
        isPending={controller.updateMutation.isPending && !!dirtyFields.name}
        saveButtonText={t.saveChanges}
        onSave={() => controller.saveField("name")}
      />
      <OrgTextSetting
        copy={t.slug}
        field="slug"
        maxLength={60}
        form={controller.form}
        isPending={controller.updateMutation.isPending && !!dirtyFields.slug}
        saveButtonText={t.saveChanges}
        onSave={() => controller.saveField("slug")}
      />
      <OrganizationLogoSetting controller={controller} org={org} t={t} />
      <OrgAIConfigCard orgSlug={org.slug ?? ""} t={t.aiConfig} />
      <OrgIntegrationsCard
        orgSlug={org.slug ?? ""}
        lang={lang}
        t={t.integrations}
      />
      <DeleteOrganizationSetting controller={controller} org={org} t={t} />
    </div>
  );
}
