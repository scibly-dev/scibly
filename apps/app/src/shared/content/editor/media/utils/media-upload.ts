"use client";

import { type MediaTypes, MediaTypesEnum } from "@/lib/media-types";
import {
  computeScaledDimensions,
  resolveCompressionTargetByteSize,
  WEBP_QUALITY_PRESETS,
} from "@/lib/utils/compress-image-core";
import { vanillaApi as api } from "@/shared/api/trpc/client";

export type S3UploadInput = {
  file: File;
  mediaType: MediaTypes;
};

const IMAGE_TYPES_WITHOUT_WEBP_CONVERSION = new Set([
  "image/gif",
  "image/svg+xml",
]);

function getFileNameWithWebpExtension(name: string) {
  const extensionIndex = name.lastIndexOf(".");
  if (extensionIndex < 0) return `${name}.webp`;
  return `${name.slice(0, extensionIndex)}.webp`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Bild konnte nicht geladen werden"));
    };
    image.src = objectUrl;
  });
}

function convertCanvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Bild konnte nicht verarbeitet werden"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function canCompressImage(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  if (typeof window === "undefined") return false;
  if (typeof document === "undefined") return false;
  if (typeof Image === "undefined") return false;
  return !IMAGE_TYPES_WITHOUT_WEBP_CONVERSION.has(file.type);
}

async function findBestWebpBlob(
  canvas: HTMLCanvasElement,
  targetByteSize: number,
): Promise<Blob | null> {
  let bestBlob: Blob | null = null;
  for (const quality of WEBP_QUALITY_PRESETS) {
    const webpBlob = await convertCanvasToBlob(canvas, quality);
    if (!bestBlob || webpBlob.size < bestBlob.size) bestBlob = webpBlob;
    if (webpBlob.size <= targetByteSize) break;
  }
  return bestBlob;
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (!canCompressImage(file)) return file;

  try {
    const image = await loadImageFromFile(file);
    const { width, height } = computeScaledDimensions(
      image.width,
      image.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);
    const targetByteSize = resolveCompressionTargetByteSize(file.size);
    const bestBlob = await findBestWebpBlob(canvas, targetByteSize);
    if (!bestBlob || bestBlob.size >= file.size) return file;

    return new File([bestBlob], getFileNameWithWebpExtension(file.name), {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.warn("Image compression failed, uploading original file", error);
    return file;
  }
}

export async function handleS3Upload(
  files: S3UploadInput[],
  useEditorBucket: boolean,
) {
  if (files.length === 0) return [];

  const uploads = await Promise.all(
    files.map(async (fileItem, index) => ({
      ...fileItem,
      file:
        fileItem.mediaType === MediaTypesEnum.IMAGE
          ? await compressImageForUpload(fileItem.file)
          : fileItem.file,
      uploadId: `upload-${index}`,
    })),
  );
  const presigned = await api.fileHandler.createPresignedUrl.mutate({
    useEditorBucket,
    uploads: uploads.map(({ uploadId, mediaType }) => ({
      uploadId,
      mediaType,
    })),
  });
  const uploadById = new Map(
    presigned.uploads.map((upload) => [upload.uploadId, upload]),
  );
  const results = await Promise.allSettled(
    uploads.map(async ({ file, mediaType, uploadId }) => {
      const upload = uploadById.get(uploadId);
      if (!upload) return null;

      const formData = new FormData();
      for (const [name, value] of Object.entries({
        ...upload.fields,
        "Content-Type": file.type,
      })) {
        formData.append(name, value);
      }
      formData.append("file", file);

      const response = await fetch(upload.url, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("S3 upload returned non-ok status code", {
          cause: response.statusText,
        });
      }
      return { url: upload.accessUrl, mediaType };
    }),
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );
}
