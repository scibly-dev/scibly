"use client";

import type {
  KnowledgeTopic,
  KnowledgeTranslations,
  TopicLanguage,
} from "../../contracts";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";

import { api } from "@/shared/api/trpc/client";

import { createTopicSchema } from "../../api/knowledge.schema";
import { topicFingerprint } from "./topic-fingerprint";

const topicFormSchema = createTopicSchema.omit({ orgSlug: true });

type TopicFormInput = z.input<typeof topicFormSchema>;
type TopicFormValues = z.output<typeof topicFormSchema>;

export function useTopicForm({
  t,
  orgSlug,
  defaultLanguage,
  topic,
  onSaved,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  defaultLanguage: TopicLanguage;
  topic: KnowledgeTopic | null;
  onSaved?: () => void;
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

  const fingerprint = topicFingerprint({
    name,
    repositories,
    maintainerMemberIds,
    language,
  });
  const [saved, setSaved] = useState(fingerprint);

  // Read off the mutation's own variables: an edit made while the save was in flight must stay dirty.
  const settle = (fields: TopicFormInput) => {
    setSaved(
      topicFingerprint({
        name: fields.name,
        repositories: fields.repositories.map(({ id, pathGlobs }) => ({
          id,
          pathGlobs: pathGlobs ?? [],
        })),
        maintainerMemberIds: fields.maintainerMemberIds ?? [],
        language: fields.language,
      }),
    );
    void utils.knowledge.list.invalidate({ orgSlug });
    if (topic)
      void utils.knowledge.get.invalidate({ orgSlug, topicId: topic.id });
    onSaved?.();
  };
  const onError = (failure: { message: string }) =>
    setError("root", { message: failure.message });

  const create = api.knowledge.create.useMutation({
    onSuccess: (_created, fields) => {
      toast.success(t.form.created);
      settle(fields);
    },
    onError,
  });
  const update = api.knowledge.update.useMutation({
    onSuccess: (saved, fields) => {
      if (saved.externallyEditedAt) toast.warning(t.form.updatedDocumentLeft);
      else toast.success(t.form.updated);
      settle(fields);
    },
    onError,
  });

  const submit = handleSubmit((fields) => {
    if (topic) update.mutate({ ...fields, orgSlug, topicId: topic.id });
    else create.mutate({ ...fields, orgSlug });
  });

  const repositoryRefusal =
    errors.repositories?.type === "manual"
      ? (errors.repositories.message ?? null)
      : errors.repositories
        ? repositories.length === 0
          ? t.form.repositoriesRequired
          : t.form.repositoriesInvalid
        : null;
  const refusal = errors.name
    ? t.form.nameRequired
    : (repositoryRefusal ?? errors.root?.message ?? null);

  return {
    control,
    register,
    setValue,
    setError,
    clearErrors,
    repositories,
    maintainerMemberIds,
    refusal,
    submit,
    isPending: create.isPending || update.isPending,
    isDirty: fingerprint !== saved,
  };
}
