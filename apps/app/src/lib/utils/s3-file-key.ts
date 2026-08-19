import { z } from "zod";

import { isUrl } from "@/lib/utils";

export const getS3FileKey = (url?: string | null) => {
  if (!url || !isUrl(url)) return;
  const parsedUrl = new URL(url);
  const fileKey = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, "");

  if (!fileKey) {
    return;
  }

  const keyParts = fileKey.split("/");
  const fileId = keyParts[keyParts.length - 1];
  const fileIdSchema = z.string().uuid();
  const result = fileIdSchema.safeParse(fileId);
  if (!result.success) {
    return;
  }

  return fileKey;
};
