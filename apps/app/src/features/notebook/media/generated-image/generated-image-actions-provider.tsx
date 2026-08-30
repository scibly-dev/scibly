"use client";

import type { ReactNode } from "react";
import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { ImageInsertTarget } from "./insert-target-storage";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  buildGeneratedImageFilename,
  downloadRemoteFile,
  triggerNavigationDownload,
} from "@/lib/utils/download-remote-file";
import { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { openCourseBuilderStudio } from "../../course-builder/hooks/open-course-builder-studio";
import { useCourseSceneTargets } from "../../course-builder/hooks/use-course-scene-targets";
import { useSidebarState } from "../../workspace/hooks/use-sidebar-state";
import { InsertScenePickerDialog } from "./insert-scene-picker-dialog";
import {
  clearInsertTargetIfSceneChanged,
  performImageInsert,
  resolveInsertTarget,
} from "./perform-image-insert";
import { refreshGeneratedImageLibrary } from "./refresh-generated-image-library";
import {
  GeneratedImageActionsContext,
  type InsertGeneratedImageLabels,
} from "./use-generated-image-actions";

interface PendingInsert {
  url: string;
  alt: string;
}

interface GeneratedImageActionsProviderProps {
  children: ReactNode;
  t: NotebookTranslations;
  notebookId: string | undefined;
  orgSlug: string;
}

function useImageDownload(notebookId: string | undefined, orgSlug: string) {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const getDownloadUrl =
    api.notebook.generatedImage.getDownloadUrl.useMutation();
  const download = useCallback(
    async ({
      url,
      alt,
      imageId,
    }: {
      url: string;
      alt: string;
      imageId?: string;
    }) => {
      const filename = buildGeneratedImageFilename(alt);
      setDownloadingKey(imageId ?? url);
      try {
        await downloadRemoteFile(url, filename);
      } catch {
        if (!imageId || !notebookId || !orgSlug)
          throw new Error("Download failed.");
        const result = await getDownloadUrl.mutateAsync({
          id: imageId,
          notebookId,
          orgSlug,
          filename,
        });
        triggerNavigationDownload(result.downloadUrl);
      } finally {
        setDownloadingKey(null);
      }
    },
    [getDownloadUrl, notebookId, orgSlug],
  );
  return {
    download,
    isDownloading: useCallback(
      (key: string) => downloadingKey === key,
      [downloadingKey],
    ),
  };
}

function useImageInsert(params: {
  notebookId: string | undefined;
  targets: ReturnType<typeof useCourseSceneTargets>["targets"];
  openPicker: (url: string, alt: string) => void;
  utils: ReturnType<typeof api.useUtils>;
  labels: InsertGeneratedImageLabels;
  invalidate: () => void;
}) {
  return useCallback(
    async (url: string, alt: string) => {
      if (!useCourseBuilderStore.getState().course) {
        toast.error(params.labels.noCourseLinked, {
          action: {
            label: params.labels.openCourseBuilder,
            onClick: () => openCourseBuilderStudio({ openCoursePicker: true }),
          },
        });
        return false;
      }
      const resolved = resolveInsertTarget(params.notebookId, params.targets);
      if (!resolved || resolved === "picker") {
        params.openPicker(url, alt);
        return false;
      }
      return performImageInsert({
        url,
        target: resolved,
        utils: params.utils,
        insertLabels: params.labels,
        notebookId: params.notebookId,
        invalidateMediaLibrary: params.invalidate,
      });
    },
    [params],
  );
}

function useConfirmImageTarget(params: {
  pending: PendingInsert | null;
  close: () => void;
  utils: ReturnType<typeof api.useUtils>;
  labels: InsertGeneratedImageLabels;
  notebookId: string | undefined;
  invalidate: () => void;
}) {
  return useCallback(
    async (target: ImageInsertTarget) => {
      if (!params.pending) return;
      const success = await performImageInsert({
        url: params.pending.url,
        target,
        utils: params.utils,
        insertLabels: params.labels,
        notebookId: params.notebookId,
        invalidateMediaLibrary: params.invalidate,
      });
      if (success) params.close();
    },
    [params],
  );
}

function useMediaLibraryInvalidation(
  notebookId: string | undefined,
  orgSlug: string,
) {
  const utils = api.useUtils();
  const rightSidebarTab = useSidebarState((state) => state.rightSidebarTab);
  const invalidate = useCallback(() => {
    if (!notebookId || rightSidebarTab !== "media") return;
    refreshGeneratedImageLibrary(utils.notebook.generatedImage.list, {
      notebookId,
      orgSlug,
    });
  }, [
    notebookId,
    orgSlug,
    rightSidebarTab,
    utils.notebook.generatedImage.list,
  ]);
  return { utils, invalidate };
}

function useActionsValue(
  insert: ReturnType<typeof useImageInsert>,
  download: ReturnType<typeof useImageDownload>["download"],
  isDownloading: ReturnType<typeof useImageDownload>["isDownloading"],
  insertLabels: InsertGeneratedImageLabels,
) {
  return useMemo(
    () => ({ insert, download, isDownloading, insertLabels }),
    [download, insert, insertLabels, isDownloading],
  );
}

export function GeneratedImageActionsProvider({
  children,
  t,
  notebookId,
  orgSlug,
}: GeneratedImageActionsProviderProps) {
  const { utils, invalidate: invalidateMediaLibrary } =
    useMediaLibraryInvalidation(notebookId, orgSlug);
  const insertLabels: InsertGeneratedImageLabels = t.chat.imageGeneration;
  const { course, activeScene } = useCourseBuilderStore();
  const {
    targets,
    isLoading: isLoadingTargets,
    reload: reloadTargets,
  } = useCourseSceneTargets(course?.id);

  useEffect(() => {
    clearInsertTargetIfSceneChanged(notebookId, activeScene?.id);
  }, [activeScene?.id, notebookId]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingInsert, setPendingInsert] = useState<PendingInsert | null>(
    null,
  );
  const { download, isDownloading } = useImageDownload(notebookId, orgSlug);

  const openPicker = useCallback(
    (url: string, alt: string) => {
      setPendingInsert({ url, alt });
      setPickerOpen(true);
      void reloadTargets();
    },
    [reloadTargets],
  );

  const insert = useImageInsert({
    notebookId,
    targets,
    openPicker,
    utils,
    labels: insertLabels,
    invalidate: invalidateMediaLibrary,
  });

  const confirmTarget = useConfirmImageTarget({
    pending: pendingInsert,
    close: () => {
      setPickerOpen(false);
      setPendingInsert(null);
    },
    utils,
    labels: insertLabels,
    notebookId,
    invalidate: invalidateMediaLibrary,
  });

  const value = useActionsValue(insert, download, isDownloading, insertLabels);

  return (
    <GeneratedImageActionsContext value={value}>
      {children}
      <InsertScenePickerDialog
        isLoading={isLoadingTargets}
        labels={insertLabels}
        onOpenChange={setPickerOpen}
        onSelect={(target) => void confirmTarget(target)}
        open={pickerOpen}
        targets={targets}
      />
    </GeneratedImageActionsContext>
  );
}
