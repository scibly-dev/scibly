"use client";

import type {
  KnowledgeTopic,
  KnowledgeTranslations,
  TopicLanguage,
} from "../../contracts";
import type { Option } from "./contracts";

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
import { Controller } from "react-hook-form";

import { api } from "@/shared/api/trpc/client";

import { MAX_TOPIC_REPOSITORIES, TOPIC_LANGUAGES } from "../../contracts";
import { Chips } from "./chips";
import { toggle } from "./contracts";
import { FieldLabel } from "./field-label";
import { MultiSelect } from "./multi-select";
import { RepoScopeRow } from "./repo-scope-row";
import { useTopicForm } from "./use-topic-form";

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
  const {
    control,
    register,
    setValue,
    setError,
    clearErrors,
    repositories,
    maintainerMemberIds,
    refusal,
    submit,
    isPending,
    isDirty,
  } = useTopicForm({ t, orgSlug, defaultLanguage, topic, onClose });

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
                  clearErrors("repositories");
                  return setValue(
                    "repositories",
                    repositories.filter((repo) => repo.id !== id),
                  );
                }
                if (repositories.length >= MAX_TOPIC_REPOSITORIES) {
                  return setError("repositories", {
                    type: "manual",
                    message: t.form.repositoriesMax.replace(
                      "{max}",
                      String(MAX_TOPIC_REPOSITORIES),
                    ),
                  });
                }
                clearErrors("repositories");
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
            disabled={isPending || !isDirty}
          >
            {isPending ? t.form.saving : t.form.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
