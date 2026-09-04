"use client";

import { api } from "@/shared/api/trpc/client";

import { PracticeEditorForm } from "./practice-editor-form";

export function PracticeEditor({
  sceneId,
  compact = false,
}: {
  sceneId: string;
  compact?: boolean;
}) {
  const { data, isLoading } = api.scene.getPractice.useQuery({ sceneId });
  if (isLoading || !data) return null;
  return (
    <PracticeEditorForm
      key={sceneId}
      sceneId={sceneId}
      initial={data}
      compact={compact}
    />
  );
}
