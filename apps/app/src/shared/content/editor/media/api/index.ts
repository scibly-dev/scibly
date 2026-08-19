import type { PrismaClient } from "@scibly/db/client";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { AppError } from "@scibly/api/application-error";
import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";
import { v4 as uuidv4 } from "uuid";

import { env } from "@/env";
import { getMediaPathPrefix, MEDIA_PATH_PREFIX } from "@/lib/file/constants";
import {
  maxAudioSizeInBytes,
  maxImageSizeInBytes,
  maxVideoSizeInBytes,
} from "@/lib/file/media-limits";
import { getPublicS3MediaUrlFromKey } from "@/lib/file/media-url";
import { type MediaTypes, MediaTypesEnum } from "@/lib/media-types";
import {
  createPresignedUrlSchema,
  deleteFileSchema,
} from "@/shared/content/editor/media/api/schema";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

type CreatePresignedUploadRequest = {
  uploadId: string;
  mediaType: MediaTypes;
};

// TODO: implement subscription-based media upload permission check
const assertMediaUploadPermission = async (
  // eslint-disable-next-line unused-imports/no-unused-vars
  db: PrismaClient,
  // eslint-disable-next-line unused-imports/no-unused-vars
  userId: string,
  // eslint-disable-next-line unused-imports/no-unused-vars
  mediaTypes: MediaTypes[],
) => {};

export const MAX_FILE_SIZE = {
  [MediaTypesEnum.IMAGE]: maxImageSizeInBytes,
  [MediaTypesEnum.VIDEO]: maxVideoSizeInBytes,
  [MediaTypesEnum.AUDIO]: maxAudioSizeInBytes,
} satisfies Record<MediaTypes, number>;

const createPresignedUploadBatch = async (
  uploadRequests: CreatePresignedUploadRequest[],
  useEditorBucket: boolean,
) => {
  const bucketPath = getMediaPathPrefix(useEditorBucket);
  const bucketName = env.MEDIA_BUCKET_NAME;

  const uploads = await Promise.all(
    uploadRequests.map(async ({ mediaType, uploadId }) => {
      const maxFileSize = MAX_FILE_SIZE[mediaType];
      const contentType = `${mediaType}/`;

      const upload = await createPresignedPost(s3Client, {
        Bucket: bucketName,
        Key: `${bucketPath}/${uuidv4()}`,
        Conditions: [
          ["content-length-range", 0, maxFileSize],
          ["starts-with", "$Content-Type", contentType],
        ],
        Expires: 600,
      });

      return {
        ...upload,
        accessUrl: getPublicS3MediaUrlFromKey(
          upload.fields.key,
          bucketName,
          env.AWS_REGION,
        ),
        mediaType,
        uploadId,
      };
    }),
  );

  return { uploads };
};

const deleteFileFromS3 = async (fileKey: string) => {
  const bucketName = env.MEDIA_BUCKET_NAME;
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }),
  );
};

export const fileHandlerRouter = createTRPCRouter({
  createPresignedUrl: protectedProcedure
    .input(createPresignedUrlSchema)
    .mutation(async ({ input, ctx }) => {
      const { useEditorBucket, uploads: uploadRequests } = input;
      const userId = ctx.session.user.id;
      await assertMediaUploadPermission(
        ctx.db,
        userId,
        uploadRequests.map(({ mediaType }) => mediaType),
      );
      return createPresignedUploadBatch(uploadRequests, useEditorBucket);
    }),

  deleteFile: protectedProcedure
    .input(deleteFileSchema)
    .mutation(async ({ input }) => {
      const { fileKey } = input;

      const allowedPrefixes = Object.values(MEDIA_PATH_PREFIX).map(
        (prefix) => `${prefix}/`,
      );
      if (!allowedPrefixes.some((prefix) => fileKey.startsWith(prefix))) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message: "Invalid file reference.",
        });
      }

      await deleteFileFromS3(fileKey);
    }),
});
