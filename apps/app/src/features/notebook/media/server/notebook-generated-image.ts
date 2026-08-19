import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { env } from "@/env";
import { GENERATED_IMAGE_PAGE_SIZE } from "@/features/notebook/media/tools/image-schemas";
import {
  getNotebookMediaS3Key,
  isNotebookMediaS3KeyInScope,
} from "@/lib/file/constants";
import { getPublicS3MediaUrlFromKey } from "@/lib/file/media-url";
import { s3Client } from "@/lib/file/s3";

export interface CreateGeneratedImageInput {
  notebookId: string;
  prompt: string;
  alt: string;
  buffer: Uint8Array;
  sourceByteSize?: number;
  aspectRatio?: string;
  toolCallId?: string;
  preferMaxQuality?: boolean;
}

type GeneratedImageListRow = {
  id: string;
  prompt: string;
  alt: string;
  s3Key: string;
  width: number | null;
  height: number | null;
  byteSize: number;
  aspectRatio: string | null;
  toolCallId: string | null;
  createdAt: Date;
};

type ImageListCursor = {
  createdAt: Date;
  id: string;
};

function toPublicUrl(s3Key: string): string {
  return getPublicS3MediaUrlFromKey(
    s3Key,
    env.MEDIA_BUCKET_NAME,
    env.AWS_REGION,
  );
}

function mapRowToPublicMediaFields(row: GeneratedImageListRow) {
  return {
    url: toPublicUrl(row.s3Key),
    prompt: row.prompt,
    alt: row.alt,
    aspectRatio: row.aspectRatio ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    byteSize: row.byteSize,
  };
}

function mapRowToCreateResult(
  row: GeneratedImageListRow,
  mediaType: "image/webp",
) {
  return {
    imageId: row.id,
    ...mapRowToPublicMediaFields(row),
    mediaType,
  };
}

function encodeImageListCursor(cursor: ImageListCursor): string {
  return `${cursor.createdAt.toISOString()}|${cursor.id}`;
}

function decodeImageListCursor(raw: string): ImageListCursor {
  const separatorIndex = raw.indexOf("|");
  if (separatorIndex <= 0) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Invalid pagination cursor.",
    });
  }

  const createdAt = new Date(raw.slice(0, separatorIndex));
  const id = raw.slice(separatorIndex + 1);

  if (Number.isNaN(createdAt.getTime()) || !id) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Invalid pagination cursor.",
    });
  }

  return { createdAt, id };
}

function chronologicallyBeforeImageCursor(cursor: ImageListCursor) {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        id: { lt: cursor.id },
      },
    ],
  };
}

export function toPublicListItem(row: GeneratedImageListRow) {
  return {
    id: row.id,
    ...mapRowToPublicMediaFields(row),
    createdAt: row.createdAt,
    toolCallId: row.toolCallId ?? undefined,
  };
}

export function assertGeneratedImageS3KeyInScope(
  s3Key: string,
  organizationId: string,
  notebookId: string,
): void {
  if (!isNotebookMediaS3KeyInScope(s3Key, organizationId, notebookId)) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Invalid generated image reference.",
    });
  }
}

// Callers check this before the quota gate so a retried/replayed tool call
// isn't billed twice.
export async function findGeneratedImageByToolCall(
  notebookId: string,
  toolCallId: string,
) {
  const existing = await db.notebookGeneratedImage.findFirst({
    where: { notebookId, toolCallId },
  });
  return existing ? mapRowToCreateResult(existing, "image/webp") : null;
}

export async function createGeneratedImage({
  notebookId,
  prompt,
  alt,
  buffer,
  sourceByteSize,
  aspectRatio,
  toolCallId,
  preferMaxQuality,
}: CreateGeneratedImageInput) {
  if (toolCallId) {
    const existing = await findGeneratedImageByToolCall(notebookId, toolCallId);
    if (existing) {
      return existing;
    }
  }

  const notebook = await db.notebook.findUnique({
    where: { id: notebookId },
    select: { organizationId: true },
  });
  if (!notebook) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Notebook not found.",
    });
  }

  const { compressImageBufferForUpload } =
    await import("@/lib/file/compress-image-server");
  const compressed = await compressImageBufferForUpload(
    buffer,
    sourceByteSize ?? buffer.byteLength,
    { preferMaxQuality },
  );

  const fileName = `${crypto.randomUUID()}.webp`;
  const s3Key = getNotebookMediaS3Key(
    notebook.organizationId,
    notebookId,
    fileName,
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.MEDIA_BUCKET_NAME,
      Key: s3Key,
      Body: compressed.buffer,
      ContentType: compressed.mediaType,
    }),
  );

  const row = await db.notebookGeneratedImage.create({
    data: {
      notebookId,
      prompt,
      alt,
      s3Key,
      width: compressed.width,
      height: compressed.height,
      byteSize: compressed.byteSize,
      aspectRatio,
      toolCallId,
    },
  });

  return mapRowToCreateResult(row, compressed.mediaType);
}

export async function listGeneratedImages(
  notebookId: string,
  options: { cursor?: string; limit?: number } = {},
) {
  const limit = options.limit ?? GENERATED_IMAGE_PAGE_SIZE;
  const decodedCursor = options.cursor
    ? decodeImageListCursor(options.cursor)
    : undefined;

  const rows = await db.notebookGeneratedImage.findMany({
    where: {
      notebookId,
      OR: decodedCursor
        ? chronologicallyBeforeImageCursor(decodedCursor).OR
        : undefined,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      prompt: true,
      alt: true,
      s3Key: true,
      width: true,
      height: true,
      byteSize: true,
      aspectRatio: true,
      toolCallId: true,
      createdAt: true,
    },
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const oldestInPage = items[items.length - 1];

  return {
    items,
    nextCursor:
      hasMore && oldestInPage
        ? encodeImageListCursor({
            createdAt: oldestInPage.createdAt,
            id: oldestInPage.id,
          })
        : undefined,
  };
}

export async function getGeneratedImageById(id: string, notebookId: string) {
  const row = await db.notebookGeneratedImage.findFirst({
    where: { id, notebookId },
  });

  if (!row) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Generated image not found.",
    });
  }

  return row;
}

export async function getGeneratedImageBytesById(
  id: string,
  notebookId: string,
): Promise<{
  bytes: Uint8Array;
  mediaType: "image/webp";
  aspectRatio?: string;
}> {
  const row = await getGeneratedImageById(id, notebookId);

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.MEDIA_BUCKET_NAME,
      Key: row.s3Key,
    }),
  );

  if (!response.Body) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Generated image file is missing.",
    });
  }

  return {
    bytes: await response.Body.transformToByteArray(),
    mediaType: "image/webp",
    aspectRatio: row.aspectRatio ?? undefined,
  };
}
