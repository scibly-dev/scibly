import type {
  ExtractableSource,
  ExtractedContent,
  SourceExtractor,
} from "./types";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { env } from "@/env";
import { s3Client } from "@/lib/file/s3";
import { SOURCE_TYPES } from "@/shared/content/sources/constants";

import { documentParserRegistry } from "../parsers";

async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: env.MEDIA_BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(command);
  if (!response.Body) throw new Error(`S3 returned empty body for key: ${key}`);
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

async function extractFromS3(
  sourceType: string,
  source: ExtractableSource,
): Promise<ExtractedContent> {
  if (!source.url) {
    throw new Error(`${sourceType} source has no file URL.`);
  }

  const buffer = await downloadFromS3(source.url);
  return documentParserRegistry.parse(sourceType, buffer);
}

export const pdfExtractor: SourceExtractor = {
  isIntegration: false,
  extract: (source) => extractFromS3(SOURCE_TYPES.PDF, source),
};

export const textExtractor: SourceExtractor = {
  isIntegration: false,
  async extract(source) {
    if (source.url) return extractFromS3(SOURCE_TYPES.TEXT, source);

    const stored = await db.notebookSource.findUnique({
      where: { id: source.id },
      select: { content: true },
    });
    if (!stored?.content) {
      throw new AppError({
        code: "BAD_REQUEST",
        applicationCode: "source.text_is_empty",
        message: "This source has no text to import.",
      });
    }
    return { text: stored.content };
  },
};
