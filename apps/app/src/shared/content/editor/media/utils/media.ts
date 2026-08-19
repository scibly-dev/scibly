"use client";

import type { Editor, NodeViewProps } from "@tiptap/core";
import type { DictionaryPages } from "@/i18n/types";

import { toast } from "sonner";

import {
  type MediaTypes,
  mediaTypeSchema,
  MediaTypesEnum,
  mediaTypeToGermanLabel,
} from "@/lib/media-types";
import { defaultMediaAttributes } from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import { updateMediaAttributes } from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import { MEDIA_TYPE_TO_NODE_NAME } from "@/shared/content/editor/blocks/media/utils/media-node-names";
import {
  handleS3Upload,
  type S3UploadInput,
} from "@/shared/content/editor/media/utils/media-upload";
import {
  validateFileSize,
  validateMediaFileType,
} from "@/shared/content/editor/media/utils/media-validation";

export {
  compressImageForUpload,
  handleS3Upload,
} from "@/shared/content/editor/media/utils/media-upload";
export {
  validateFileSize,
  validateUrl,
} from "@/shared/content/editor/media/utils/media-validation";

const UNEXPECTED_ERROR_MESSAGE = `Ein unerwarteter Fehler ist aufgetreten, während die Datei hochgeladen wurde`;

export type FileSelectionEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.DragEvent<HTMLDivElement>;

function getSelectedFile(event: FileSelectionEvent): File | null {
  if ("target" in event && event.target instanceof HTMLInputElement) {
    return event.target.files?.[0] ?? null;
  }
  if ("dataTransfer" in event) {
    return event.dataTransfer.files[0] ?? null;
  }
  return null;
}

export const handleFileUpload = async (
  e: FileSelectionEvent,
  mediaType: MediaTypes,
  useEditorBucket: boolean,
): Promise<string | undefined> => {
  e.preventDefault();
  const file = getSelectedFile(e);
  if (!file) return;

  if (!validateMediaFileType(file, mediaType)) return;
  if (!validateFileSize(file, mediaType)) return;

  try {
    const uploadedFiles = await handleS3Upload(
      [{ file, mediaType }],
      useEditorBucket,
    );
    const uploadedUrl = uploadedFiles[0]?.url;
    if (!uploadedUrl) {
      throw new Error("No successful upload result returned");
    }
    toast.success(
      `${mediaTypeToGermanLabel[mediaType]} erfolgreich hochgeladen`,
    );
    return uploadedUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    toast.error(
      `Ein Fehler ist aufgetret, während das ${mediaTypeToGermanLabel[mediaType]} hochgeladen wurde`,
    );
  }
};

export const handleMediaPlaceholderFileDrop = async (
  e: React.DragEvent<HTMLDivElement>,
  mediaType: MediaTypes,
  nodeViewProps: NodeViewProps,
) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 1) {
    toast.error(`Bitte wähle nur ein ${mediaTypeToGermanLabel[mediaType]}`);
    return;
  }
  if (files.length === 1) {
    const file = files[0];
    if (!file) return;
    if (!file.type.includes(mediaType)) {
      toast.error(
        `Du kannst nur ${mediaTypeToGermanLabel[mediaType]} ${mediaType === "image" ? "er" : "s"} in diesem Block hochladen`,
      );
      return;
    }
    const url = await handleFileUpload(e, mediaType, true);
    if (url) {
      updateMediaAttributes(nodeViewProps, {
        src: url,
        width: "100%",
        height: "auto",
      });
    }
  }
};

export const getMediaLabels = (
  mediaType: MediaTypes,
  mediaTranslations: DictionaryPages["editorUi"]["media"],
) => {
  return {
    upload:
      mediaType === "image"
        ? mediaTranslations.addImage
        : mediaType === "audio"
          ? mediaTranslations.addAudio
          : mediaTranslations.addVideo,
    embed:
      mediaType === "image"
        ? mediaTranslations.addOrEditImageLink
        : mediaType === "audio"
          ? mediaTranslations.addOrEditAudioLink
          : mediaTranslations.addOrEditVideoLink,
    type:
      mediaType === "image"
        ? mediaTranslations.imageType
        : mediaType === "audio"
          ? mediaTranslations.audioType
          : mediaTranslations.videoType,
  };
};

const _insertMediaNode = (
  editor: Editor,
  type: MediaTypes,
  content: string,
  pos: number,
) => {
  const nodeType = MEDIA_TYPE_TO_NODE_NAME[type];
  editor
    .chain()
    .insertContentAt(pos, {
      type: nodeType,
      attrs: {
        mediaBlockAttributes: {
          ...defaultMediaAttributes,
          src: content,
        },
      },
    })
    .focus()
    .run();
};

export function insertMediaNodeAtEnd(
  editor: Editor,
  url: string,
  _alt?: string,
) {
  _insertMediaNode(
    editor,
    MediaTypesEnum.IMAGE,
    url,
    editor.state.doc.content.size,
  );
}

const _fileUploadNotifier = async (
  uploadPromises: Promise<string | void>[],
) => {
  if (uploadPromises.length === 0) {
    return;
  }
  const notificationMessage =
    uploadPromises.length === 1
      ? "Datei wird hochgeladen..."
      : "Dateien werden hochgeladen...";

  const successMessage = `${uploadPromises.length === 1 ? "Datei" : "Dateien"} erfolgreich hochgeladen`;

  const errorMessage = `Ein Fehler ist aufgetreten, während die ${uploadPromises.length === 1 ? "Datei" : "Dateien"} hochgeladen wurden`;

  toast.promise(Promise.all(uploadPromises), {
    loading: notificationMessage,
    success: successMessage,
    error: errorMessage,
  });
};

export const handleEditorFileDrop = async (
  editor: Editor,
  files: File[],
  pos: number,
) => {
  const uploadTasks: Promise<void>[] = [];
  const filesToUpload: S3UploadInput[] = [];

  for (const file of files) {
    const mediaType = mediaTypeSchema.safeParse(file.type.split("/")[0]);
    if (!mediaType.success || !validateFileSize(file, mediaType.data)) continue;

    filesToUpload.push({ file, mediaType: mediaType.data });
  }

  if (filesToUpload.length > 0) {
    uploadTasks.push(
      handleS3Upload(filesToUpload, true)
        .then((uploadedFiles) => {
          if (uploadedFiles.length === 0) {
            throw new Error("No successful upload result returned");
          }
          uploadedFiles.forEach(({ url, mediaType }) => {
            _insertMediaNode(editor, mediaType, url, pos);
          });
        })
        .catch((error) => {
          console.error(error);
          toast.error(UNEXPECTED_ERROR_MESSAGE);
        }),
    );
  }

  await _fileUploadNotifier(uploadTasks);
};

export const handleEditorFilePaste = async (
  editor: Editor,
  files: File[],
  pastedHtmlContent: string | undefined,
) => {
  if (pastedHtmlContent) {
    return;
  }
  await handleEditorFileDrop(editor, files, editor.state.selection.anchor);
};
