"use client";

import type {
  KnowledgeTopic,
  KnowledgeTranslations,
  TopicLanguage,
} from "../contracts";

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
import { Label } from "@scibly/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { cn } from "@scibly/ui/utils";
import { AlertCircle, ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { isValidPathGlob, TOPIC_LANGUAGES } from "../contracts";

type Option = { id: string; label: string };

// What the form holds per repository: exactly what the API takes.
type RepoScope = { id: string; pathGlobs: string[] };

const toggle = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((each) => each !== value)
    : [...values, value];

// A picked folder is stored as the glob it means, so nothing downstream has to
// know it was picked from a list rather than typed.
const FOLDER_SUFFIX = "/**";

// A required field is marked, an optional one says so — no field is left for the
// reader to guess about.
function FieldLabel({
  children,
  optional,
  htmlFor,
}: {
  children: string;
  optional?: string;
  htmlFor?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-baseline gap-1.5">
      {children}
      {optional ? (
        <span className="text-ink-faint text-[11px] font-normal">
          {optional}
        </span>
      ) : (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </Label>
  );
}

// Search on top, checkboxes below. Lives inside a popover, which brings its own
// border and background. The list overscroll is contained so reaching its end
// does not start scrolling the dialog behind it.
function Picker({
  t,
  options,
  selected,
  onToggle,
  empty,
}: {
  t: KnowledgeTranslations;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
  empty: string;
}) {
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="border-edge border-b p-1.5">
        <Input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t.form.filterPlaceholder}
          className="h-8 rounded-lg text-[13px]"
        />
      </div>
      <div className="max-h-56 overflow-y-auto overscroll-contain p-1">
        {options.length === 0 ? (
          <p className="text-ink-faint px-2 py-6 text-center text-[12px]">
            {empty}
          </p>
        ) : shown.length === 0 ? (
          <p className="text-ink-faint px-2 py-6 text-center text-[12px]">
            {t.form.noMatches}
          </p>
        ) : (
          shown.map((option) => (
            <label
              key={option.id}
              title={option.label}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px]",
                selected.includes(option.id)
                  ? "bg-primary/10 text-ink font-medium"
                  : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              <input
                type="checkbox"
                className="accent-primary h-3.5 w-3.5 shrink-0"
                checked={selected.includes(option.id)}
                onChange={() => onToggle(option.id)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// An input-height trigger that opens the picker, so a field's size never
// depends on how much there is to pick from.
function MultiSelect({
  t,
  options,
  selected,
  onToggle,
  placeholder,
  empty,
}: {
  t: KnowledgeTranslations;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  empty: string;
}) {
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className={selected.length === 0 ? "text-ink-faint" : "text-ink"}>
            {selected.length === 0
              ? placeholder
              : t.form.selected.replace("{count}", String(selected.length))}
          </span>
          <ChevronDown
            className="text-ink-faint h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
      >
        <Picker
          t={t}
          options={options}
          selected={selected}
          onToggle={onToggle}
          empty={empty}
        />
      </PopoverContent>
    </Popover>
  );
}

function Chips({
  values,
  onRemove,
}: {
  values: Option[];
  onRemove: (id: string) => void;
}) {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value.id}
          className="border-edge text-ink flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-[12px]"
        >
          <span className="truncate">{value.label}</span>
          <button
            type="button"
            onClick={() => onRemove(value.id)}
            aria-label={value.label}
            className="text-ink-faint hover:text-ink"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

// One row of the scope hierarchy: the repository on top, and beneath it the
// folders or patterns that narrow it. No globs means the whole repository.
function RepoScopeRow({
  t,
  orgSlug,
  id,
  label,
  stale,
  pathGlobs,
  onGlobs,
  onRemove,
  onInvalid,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  id: string;
  label: string;
  // A topic outlives the installation it was scoped through: reconnecting under
  // a different GitHub App leaves ids that nothing reaches any more. Such a row
  // only states that and offers removal — there are no folders to ask for.
  stale: boolean;
  pathGlobs: string[];
  onGlobs: (globs: string[]) => void;
  onRemove: () => void;
  onInvalid: (message: string | null) => void;
}) {
  const [pattern, setPattern] = useState("");
  const folders = api.knowledge.listFolders.useQuery(
    { orgSlug, repositoryId: id },
    { enabled: !stale },
  );

  // Refused where it is typed: the server states the same rule, but its answer
  // for any malformed input is one generic line that names no field.
  const addPattern = () => {
    const glob = pattern.trim();
    if (glob === "") return;
    if (!isValidPathGlob(glob)) {
      return onInvalid(t.form.pathsInvalid.replace("{glob}", glob));
    }
    onInvalid(null);
    if (!pathGlobs.includes(glob)) onGlobs([...pathGlobs, glob]);
    setPattern("");
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "truncate text-[13px] font-medium",
            stale ? "text-destructive" : "text-ink",
          )}
          title={label}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={label}
          className="text-ink-faint hover:text-ink shrink-0"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {stale ? (
        <p className="text-destructive text-[12px]">
          {t.form.repositoriesUnreachable}
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 font-normal"
                >
                  {t.form.foldersBrowse}
                  <ChevronDown
                    className="text-ink-faint h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 overflow-hidden p-0"
              >
                <Picker
                  t={t}
                  options={(folders.data?.folders ?? []).map((folder) => ({
                    id: folder,
                    label: folder,
                  }))}
                  selected={pathGlobs
                    .filter((glob) => glob.endsWith(FOLDER_SUFFIX))
                    .map((glob) => glob.slice(0, -FOLDER_SUFFIX.length))}
                  onToggle={(folder) =>
                    onGlobs(toggle(pathGlobs, folder + FOLDER_SUFFIX))
                  }
                  empty={
                    folders.isPending
                      ? t.form.foldersLoading
                      : t.form.foldersEmpty
                  }
                />
              </PopoverContent>
            </Popover>
            <Input
              value={pattern}
              placeholder={t.form.pathsPlaceholder}
              onChange={(event) => setPattern(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPattern();
                }
              }}
              className="h-8 flex-1 text-[13px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPattern}
              disabled={pattern.trim() === ""}
              className="shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t.form.add}
            </Button>
          </div>
          <Chips
            values={pathGlobs.map((glob) => ({ id: glob, label: glob }))}
            onRemove={(glob) =>
              onGlobs(pathGlobs.filter((each) => each !== glob))
            }
          />
        </>
      )}
    </div>
  );
}

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
  const [name, setName] = useState(topic?.name ?? "");
  const [repositories, setRepositories] = useState<RepoScope[]>(
    topic?.repositories.map(({ id, pathGlobs }) => ({ id, pathGlobs })) ?? [],
  );
  const [maintainerMemberIds, setMaintainerMemberIds] = useState(
    topic?.maintainers.map((maintainer) => maintainer.memberId) ?? [],
  );
  const [language, setLanguage] = useState<TopicLanguage>(
    topic?.language ?? defaultLanguage,
  );
  // Shown in the form, never as a toast: a refused save must leave the filled-in
  // form standing and say why right where the fix has to happen.
  const [error, setError] = useState<string | null>(null);

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

  const isStale = (id: string) =>
    grants.data !== undefined &&
    !repositoryOptions.some((option) => option.id === id);

  // Order is not part of a scope, so re-picking the same things is not a change
  // and must not cost a write.
  const state = JSON.stringify([
    name.trim(),
    [...repositories]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((repo) => [repo.id, [...repo.pathGlobs].sort()]),
    [...maintainerMemberIds].sort(),
    language,
  ]);
  const [saved, setSaved] = useState(state);

  const onSuccess = (message: string) => () => {
    toast.success(message);
    void utils.knowledge.list.invalidate({ orgSlug });
    onClose();
  };
  const onError = (failure: { message: string }) => setError(failure.message);

  const create = api.knowledge.create.useMutation({
    onSuccess: onSuccess(t.form.created),
    onError,
  });
  const update = api.knowledge.update.useMutation({
    onSuccess: onSuccess(t.form.updated),
    onError,
  });
  const isPending = create.isPending || update.isPending;

  const submit = () => {
    if (name.trim() === "") return setError(t.form.nameRequired);
    if (repositories.length === 0)
      return setError(t.form.repositoriesRequired);

    setError(null);
    setSaved(state);
    const fields = { orgSlug, name, repositories, maintainerMemberIds, language };
    if (topic) update.mutate({ ...fields, topicId: topic.id });
    else create.mutate(fields);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl"
        // A half-filled form is worth more than a stray click, so only Cancel,
        // Escape, and the close button end it.
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
                value={name}
                maxLength={120}
                placeholder={t.form.namePlaceholder}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="topic-language">
                {t.form.language}
              </FieldLabel>
              <Select
                value={language}
                onValueChange={(value) =>
                  // SAFETY: the only items rendered are TOPIC_LANGUAGES, so the
                  // value reported back is one of them.
                  setLanguage(value as TopicLanguage)
                }
              >
                <SelectTrigger id="topic-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOPIC_LANGUAGES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code === "de" ? t.form.languageDe : t.form.languageEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onToggle={(id) =>
                setRepositories((repos) =>
                  repos.some((repo) => repo.id === id)
                    ? repos.filter((repo) => repo.id !== id)
                    : [...repos, { id, pathGlobs: [] }],
                )
              }
              placeholder={t.form.repositoriesSelect}
              empty={
                grants.isPending
                  ? t.form.repositoriesLoading
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
                      setRepositories((repos) =>
                        repos.map((each) =>
                          each.id === repo.id
                            ? { ...each, pathGlobs: globs }
                            : each,
                        ),
                      )
                    }
                    onRemove={() =>
                      setRepositories((repos) =>
                        repos.filter((each) => each.id !== repo.id),
                      )
                    }
                    onInvalid={setError}
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
                setMaintainerMemberIds((ids) => toggle(ids, id))
              }
              placeholder={t.form.maintainersSelect}
              empty={t.form.maintainersEmpty}
            />
            <Chips
              values={maintainerMemberIds.map((id) => ({
                id,
                label:
                  memberOptions.find((option) => option.id === id)?.label ?? id,
              }))}
              onRemove={(id) =>
                setMaintainerMemberIds((ids) => toggle(ids, id))
              }
            />
          </div>

          {error === null ? null : (
            <p
              role="alert"
              className="text-destructive flex items-start gap-2 rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-[13px]"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t.form.cancel}
          </Button>
          <Button onClick={submit} disabled={isPending || state === saved}>
            {isPending ? t.form.saving : t.form.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
