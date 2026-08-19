"use client";

import { api } from "@/shared/api/trpc/client";
import { EXTENSION_TO_SOURCE_TYPE } from "@/shared/content/sources/constants";

import { type NotebookSourcesTranslations } from "./i18n/sources.types";
import { reportSourceError } from "./report-source-error";

export async function uploadSourceFile(
  file: File,
  upload: { url: string; fields: Record<string, string> },
) {
  const formData = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) =>
    formData.append(key, value),
  );
  formData.append("file", file);
  const response = await fetch(upload.url, { method: "POST", body: formData });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `S3 returned status ${response.status}: ${detail || response.statusText}`,
    );
  }
}

export function useSourceUploads(params: {
  atLimit: boolean;
  entitlementCopy: NotebookSourcesTranslations["entitlement"];
  ensureNotebook: () => Promise<string>;
  onSettled: () => void;
}) {
  const utils = api.useUtils();
  const upload = api.notebook.source.upload.useMutation({
    onError: (error) =>
      reportSourceError(
        "[SourcesPanel] Upload mutation failed:",
        error,
        params.entitlementCopy,
      ),
  });
  const confirm = api.notebook.source.confirmUpload.useMutation({
    onSuccess: params.onSettled,
    onError: (error) =>
      reportSourceError(
        "[SourcesPanel] Confirm upload failed:",
        error,
        params.entitlementCopy,
      ),
  });
  const fail = api.notebook.source.failUpload.useMutation({
    onSuccess: params.onSettled,
  });
  return (files: FileList) => {
    if (params.atLimit) return;
    for (const file of Array.from(files)) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const sourceType = EXTENSION_TO_SOURCE_TYPE.get(extension);
      if (!sourceType) {
        console.warn(`[SourcesPanel] Unsupported file extension: ${extension}`);
        continue;
      }
      void params.ensureNotebook().then((notebookId) => {
        upload.mutate(
          {
            notebookId,
            fileName: file.name,
            fileSize: file.size,
            sourceType,
          },
          {
            onSuccess: async (data) => {
              void utils.notebook.source.list.invalidate({ notebookId });
              try {
                await uploadSourceFile(file, data.upload);
                confirm.mutate({
                  sourceId: data.sourceId,
                  s3Key: data.s3Key,
                });
              } catch (error) {
                console.error("[SourcesPanel] S3 upload failed:", error);
                fail.mutate({
                  sourceId: data.sourceId,
                  error:
                    error instanceof Error ? error.message : "S3 upload failed",
                });
              }
            },
          },
        );
      });
    }
  };
}
