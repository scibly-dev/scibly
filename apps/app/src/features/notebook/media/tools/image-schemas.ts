import { z } from "zod";

export const GENERATED_IMAGE_PAGE_SIZE = 12;
export const GENERATED_IMAGE_ALT_MIN_LENGTH = 10;

const aspectRatioSchema = z
  .string()
  .regex(/^\d+:\d+$/, "aspectRatio must use width:height format (e.g. 16:9)")
  .optional();

const imageEditRegionSchema = z.object({
  x: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Horizontal position of the edit, as a percentage from the left edge (0–100).",
    ),
  y: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Vertical position of the edit, as a percentage from the top edge (0–100).",
    ),
  radius: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe(
      "Size of the region to edit, as a percentage of the image's shorter edge. Only pixels within this radius of (x, y) may change; everything else is restored from the original. Copy the value the user provided.",
    ),
  instruction: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      "What to change at this position. Keep it specific to the marked region.",
    ),
});

export const generateImageInputSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(4000)
    .optional()
    .describe(
      "Detailed prompt for the image generation model. Required when generating a new image. When editing (sourceImageId set), optional — describe any global change, or omit it and rely on regions for localized edits.",
    ),
  alt: z
    .string()
    .min(GENERATED_IMAGE_ALT_MIN_LENGTH)
    .max(200)
    .describe(
      "Required short description of the image for accessibility and future context (plain language, 10–200 characters).",
    ),
  aspectRatio: aspectRatioSchema.describe(
    "Optional aspect ratio for the generated image (e.g. 16:9, 1:1, 4:3). Ignored when editing an existing image.",
  ),
  sourceImageId: z
    .string()
    .optional()
    .describe(
      "The imageId of an existing generated image to refine. When set, the model edits that image (image-to-image) instead of creating a new one, keeping unmarked areas identical.",
    ),
  regions: z
    .array(imageEditRegionSchema)
    .max(20)
    .optional()
    .describe(
      "Localized edit instructions anchored to positions on the source image (percentages from the top-left). Only meaningful together with sourceImageId. Copy the exact x/y values and text the user provided.",
    ),
});

export const generateImageOutputSchema = z.object({
  imageId: z.string(),
  url: z.string().url(),
  prompt: z.string(),
  alt: z.string(),
  mediaType: z.literal("image/webp"),
  aspectRatio: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  byteSize: z.number().int().positive(),
});

export type GenerateImageInput = z.infer<typeof generateImageInputSchema>;
export type ImageEditRegion = z.infer<typeof imageEditRegionSchema>;

export const DEFAULT_REGION_RADIUS = 12;

export function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function toImageEditRegions(
  comments: ReadonlyArray<{
    x: number;
    y: number;
    radius: number;
    text: string;
  }>,
): ImageEditRegion[] {
  return comments
    .filter((comment) => comment.text.trim())
    .map((comment) => ({
      x: comment.x,
      y: comment.y,
      radius: comment.radius,
      instruction: comment.text.trim(),
    }));
}

export type ImageAnnotateRegion = Pick<
  ImageEditRegion,
  "x" | "y" | "radius"
> & { radius: number };

export const listNotebookMediaInputSchema = z.object({
  cursor: z
    .string()
    .optional()
    .describe(
      "Opaque keyset cursor from nextCursor on a prior call (loads the next older page).",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(48)
    .optional()
    .describe("Maximum images to return per page (default 12, max 48)."),
});

const listNotebookMediaItemSchema = z.object({
  id: z.string(),
  url: z.url(),
  alt: z.string(),
  prompt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  byteSize: z.number().int().positive(),
  aspectRatio: z.string().optional(),
  createdAt: z.coerce.date(),
  toolCallId: z.string().optional(),
});

export const listNotebookMediaOutputSchema = z.object({
  items: z.array(listNotebookMediaItemSchema),
  nextCursor: z.string().optional(),
});

export type ListNotebookMediaInput = z.infer<
  typeof listNotebookMediaInputSchema
>;
export type GeneratedImageListItem = z.infer<
  typeof listNotebookMediaItemSchema
>;
