"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import { useMemo } from "react";

import { useCourseBuilderRuntime } from "@/features/notebook/course-builder/components/course-builder-runtime-context";
import { GeneratedImageActionsContext } from "@/features/notebook/media/generated-image/use-generated-image-actions";
import { triggerNavigationDownload } from "@/lib/utils/download-remote-file";

export function DemoGeneratedImageActionsProvider({
  children,
  t,
}: {
  children: React.ReactNode;
  t: NotebookTranslations;
}) {
  const {
    meta: { editorCommandRef },
  } = useCourseBuilderRuntime();
  const value = useMemo(
    () => ({
      insert: async (url: string, alt: string) =>
        editorCommandRef.current?.insertImage({ url, alt }) ?? false,
      download: async ({
        url,
      }: {
        url: string;
        alt: string;
        imageId?: string;
      }) => {
        triggerNavigationDownload(url);
      },
      isDownloading: () => false,
      insertLabels: t.chat.imageGeneration,
    }),
    [editorCommandRef, t.chat.imageGeneration],
  );

  return (
    <GeneratedImageActionsContext value={value}>
      {children}
    </GeneratedImageActionsContext>
  );
}
