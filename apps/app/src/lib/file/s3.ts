import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/env";

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  forcePathStyle: true,
});

export async function getPresignedDownloadUrl(
  key: string,
  options?: { filename?: string },
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.MEDIA_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: options?.filename
      ? `attachment; filename="${options.filename.replace(/"/g, "")}"`
      : undefined,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 60 });
}

export async function tryDeleteNotebookSourceFile(
  fileKey: string | null | undefined,
  logPrefix = "[S3]",
): Promise<void> {
  if (!fileKey) return;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.MEDIA_BUCKET_NAME,
        Key: fileKey,
      }),
    );
  } catch (err) {
    console.error(`${logPrefix} Failed to delete S3 file ${fileKey}:`, err);
  }
}
