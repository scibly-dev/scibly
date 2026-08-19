export interface GeneratedImageMetadata {
  alt: string;
  prompt?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  aspectRatio?: string;
  createdAt?: Date | string;
}

export interface ImageMetadataLabels {
  showDetails: string;
  title: string;
  alt: string;
  prompt: string;
  dimensions: string;
  fileSize: string;
  aspectRatio: string;
  created: string;
}

export type GeneratedImageOverlayVariant = "library" | "chat";
