"use client";

import type { GeneratedImageOverlayVariant } from "./generated-image-types";

interface ImageActionLabels {
  insertIntoScene: string;
  open: string;
  downloadImage: string;
  openInImageEditor?: string;
  moreActions?: string;
}

export interface SharedImageActionProps {
  url: string;
  labels: ImageActionLabels;
  variant: GeneratedImageOverlayVariant;
  onInsert?: () => void;
  onDownload: () => void | Promise<void>;
  isDownloading?: boolean;
}
