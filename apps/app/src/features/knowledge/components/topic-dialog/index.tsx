"use client";

import type {
  KnowledgeTopic,
  KnowledgeTranslations,
  TopicLanguage,
} from "../../contracts";
import type { Option } from "./contracts";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";

import { api } from "@/shared/api/trpc/client";

import { createTopicSchema } from "../../api/knowledge.schema";
import { MAX_TOPIC_REPOSITORIES, TOPIC_LANGUAGES } from "../../contracts";
import { Chips } from "./chips";
import { toggle } from "./contracts";
import { FieldLabel } from "./field-label";
import { MultiSelect } from "./multi-select";
import { RepoScopeRow } from "./repo-scope-row";

const topicFormSchema = createTopicSchema.omit({ orgSlug: true });

type TopicFormInput = z.input<typeof topicFormSchema>;
type TopicFormValues = z.output<typeof topicFormSchema>;

export function TopicDialog({
  t,
  orgSlug,
  orgId,
  defaultLanguage,
  topic,
  onClose,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  orgId: string;
  defaultLanguage: TopicLanguage;
  topic: KnowledgeTopic | null;
  onClose: () => void;
}) {
  const utils = api.useUtils();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<TopicFormInput, unknown, TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: topic?.name ?? "",
      // `pathGlobs` is spelled out because the schema's default only fills in on the way through the parser, never in form state.
      repositories:
        topic?.repositories.map(({ id, pathGlobs }) => ({ id, pathGlobs })) ??
        [],
      maintainerMemberIds:
        topic?.maintainers.map((maintainer) => maintainer.memberId) ?? [],
      language: topic?.language ?? defaultLanguage,
    },
  });

  const name = useWatch({ control, name: "name" });
  const repositories = useWatch({ control, name: "repositories" }).map(
    ({ id, pathGlobs }) => ({ id, pathGlobs: pathGlobs ?? [] }),
  );
  const maintainerMemberIds =
    useWatch({ control, name: "maintainerMemberIds" }) ?? [];
  const language = useWatch({ control, name: "language" });

  const grants = api.integration.listGrants.useQuery({
    orgSlug,
    provider: "GITHUB",
  });
  const members = api.organization.listMembers.useQuery({
    organizationId: orgId,
  });

  const repositoryOptions: Option[] = (grants.data?.grants ?? []).map(
    (grant) => ({ id: grant.id, label: grant.name }),
  );
  const memberOptions: Option[] = (members.data ?? []).map((member) => ({
    id: member.id,
    label: member.user.name || member.user.email,
  }));

  // Only a complete listing may call a row stale: one that stopped at its page budget has not seen every repository.
  const listedEverything =
    grants.data !== undefined &&
    grants.data.grants.length >= grants.data.totalCount;
  const isStale = (id: string) =>
    listedEverything && !repositoryOptions.some((option) => option.id === id);

  // Order is not part of a scope, so re-picking the same things must not cost a write.
  const state = JSON.stringify([
    name.trim(),
    [...repositories]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((repo) => [repo.id, [...repo.pathGlobs].sort()]),
    [...maintainerMemberIds].sort(),
    language,
  ]);
  const [saved] = useState(state);

  const onSuccess = (message: string) => () => {
    toast.success(message);
    void utils.knowledge.list.invalidate({ orgSlug });
    onClose();
  };
  const onError = (failure: { message: string }) =>
    setError("root", { message: failure.message });

  const create = api.knowledge.create.useMutation({
    onSuccess: onSuccess(t.form.created),
    onError,
  });
  const update = api.knowledge.update.useMutation({
    onSuccess: onSuccess(t.form.updated),
    onError,
  });
  const isPending = create.isPending || update.isPending;

  const submit = handleSubmit((fields) => {
    if (topic) update.mutate({ ...fields, orgSlug, topicId: topic.id });
    else create.mutate({ ...fields, orgSlug });
  });

  const refusal = errors.name
    ? t.form.nameRequired
    : errors.repositories
      ? repositories.length === 0
        ? t.form.repositoriesRequired
        : t.form.repositoriesInvalid
      : (errors.root?.message ?? null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {topic ? t.form.editTitle : t.form.createTitle}
          </DialogTitle>
          <DialogDescription>{t.form.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="topic-name">{t.form.name}</FieldLabel>
              <Input
                id="topic-name"
                maxLength={120}
                placeholder={t.form.namePlaceholder}
                {...register("name")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="topic-language">
                {t.form.language}
              </FieldLabel>
              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="topic-language" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPIC_LANGUAGES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code === "de"
                            ? t.form.languageDe
                            : t.form.languageEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>{t.form.repositories}</FieldLabel>
            <p className="text-ink-faint text-[12px]">
              {t.form.repositoriesHint}
            </p>
            <MultiSelect
              t={t}
              options={repositoryOptions}
              selected={repositories.map((repo) => repo.id)}
              onToggle={(id) => {
                if (repositories.some((repo) => repo.id === id)) {
                  clearErrors("root");
                  return setValue(
                    "repositories",
                    repositories.filter((repo) => repo.id !== id),
                  );
                }
                if (repositories.length >= MAX_TOPIC_REPOSITORIES) {
                  return setError("root", {
                    message: t.form.repositoriesMax.replace(
                      "{max}",
                      String(MAX_TOPIC_REPOSITORIES),
                    ),
                  });
                }
                clearErrors("root");
                setValue("repositories", [
                  ...repositories,
                  { id, pathGlobs: [] },
                ]);
              }}
              placeholder={t.form.repositoriesSelect}
              empty={
                grants.isPending
                  ? t.form.repositoriesLoading
                  : grants.isError
                    ? t.form.repositoriesUnavailable
                    : t.form.repositoriesEmpty
              }
            />
            {repositories.length === 0 ? null : (
              <div className="border-edge divide-edge divide-y rounded-xl border">
                {repositories.map((repo) => (
                  <RepoScopeRow
                    key={repo.id}
                    t={t}
                    orgSlug={orgSlug}
                    id={repo.id}
                    label={
                      repositoryOptions.find((option) => option.id === repo.id)
                        ?.label ?? repo.id
                    }
                    stale={isStale(repo.id)}
                    pathGlobs={repo.pathGlobs}
                    onGlobs={(globs) =>
                      setValue(
                        "repositories",
                        repositories.map((each) =>
                          each.id === repo.id
                            ? { ...each, pathGlobs: globs }
                            : each,
                        ),
                      )
                    }
                    onRemove={() =>
                      setValue(
                        "repositories",
                        repositories.filter((each) => each.id !== repo.id),
                      )
                    }
                    onInvalid={(message) =>
                      message === null
                        ? clearErrors("root")
                        : setError("root", { message })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel optional={t.form.optional}>
              {t.form.maintainers}
            </FieldLabel>
            <p className="text-ink-faint text-[12px]">
              {t.form.maintainersHint}
            </p>
            <MultiSelect
              t={t}
              options={memberOptions}
              selected={maintainerMemberIds}
              onToggle={(id) =>
                setValue("maintainerMemberIds", toggle(maintainerMemberIds, id))
              }
              placeholder={t.form.maintainersSelect}
              empty={
                members.isPending
                  ? t.form.maintainersLoading
                  : members.isError
                    ? t.form.maintainersUnavailable
                    : t.form.maintainersEmpty
              }
            />
            <Chips
              t={t}
              values={maintainerMemberIds.map((id) => ({
                id,
                label:
                  memberOptions.find((option) => option.id === id)?.label ?? id,
              }))}
              onRemove={(id) =>
                setValue("maintainerMemberIds", toggle(maintainerMemberIds, id))
              }
            />
          </div>

          {refusal === null ? null : (
            <p
              role="alert"
              className="text-destructive flex items-start gap-2 rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-[13px]"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {refusal}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t.form.cancel}
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={isPending || state === saved}
          >
            {isPending ? t.form.saving : t.form.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
