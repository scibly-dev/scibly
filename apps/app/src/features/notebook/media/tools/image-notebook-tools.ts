import { tool } from "ai";

import "server-only";
import { editNotebookImage } from "@/features/notebook/media/server/edit-notebook-image";
import { generateNotebookImage } from "@/features/notebook/media/server/generate-notebook-image";
import {
  createGeneratedImage,
  findGeneratedImageByToolCall,
  getGeneratedImageBytesById,
  listGeneratedImages,
  toPublicListItem,
} from "@/features/notebook/media/server/notebook-generated-image";
import {
  type GenerateImageInput,
  generateImageInputSchema,
  generateImageOutputSchema,
  type ListNotebookMediaInput,
  listNotebookMediaInputSchema,
  listNotebookMediaOutputSchema,
} from "@/features/notebook/media/tools/image-schemas";
import {
  type ImageGenerationBackend,
  resolveImageGenerationBackend,
} from "@/shared/ai/server/models/registry";
import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

import { resolveNotebookInOrg } from "../../workspace/server/access";
import { chargeImageGeneration } from "../server/image-usage";

type ImageNotebookToolContext = {
  notebookId?: string;
  orgSlug?: string;
  session: { user: { id: string } };
};

function logImageGeneration(
  event: Record<string, string | number | boolean | undefined>,
) {
  console.info("[image-generation]", event);
}

async function listNotebookMedia(
  notebookId: string | undefined,
  userId: string,
  orgSlug: string | undefined,
  input: ListNotebookMediaInput,
) {
  const parsed = listNotebookMediaInputSchema.parse(input);

  if (!notebookId || !orgSlug) {
    throw new Error("listNotebookMedia requires an active notebook context.");
  }

  const { notebook } = await resolveNotebookInOrg(notebookId, userId, orgSlug);
  const { items, nextCursor } = await listGeneratedImages(notebook.id, {
    cursor: parsed.cursor,
    limit: parsed.limit,
  });

  return {
    items: items.map((row) => toPublicListItem(row)),
    nextCursor,
  };
}

type ParsedImageInput = ReturnType<typeof generateImageInputSchema.parse>;

type ImageRun = {
  notebook: { id: string };
  parsed: ParsedImageInput;
  orgSlug: string;
  backend: ImageGenerationBackend;
  toolCallId?: string;
};

async function createEditedImage(
  { notebook, parsed, orgSlug, backend, toolCallId }: ImageRun,
  sourceImageId: string,
) {
  const source = await getGeneratedImageBytesById(sourceImageId, notebook.id);
  const aspectRatio = source.aspectRatio ?? parsed.aspectRatio;
  const { image, edited, instruction } = await editNotebookImage({
    sourceBytes: source.bytes,
    prompt: parsed.prompt ?? "",
    regions: parsed.regions ?? [],
    orgSlug,
    aspectRatio,
    backend,
  });
  const result = await createGeneratedImage({
    notebookId: notebook.id,
    prompt: instruction,
    alt: parsed.alt,
    buffer: image.uint8Array,
    sourceByteSize: image.uint8Array.byteLength,
    aspectRatio,
    toolCallId,
    preferMaxQuality: true,
  });
  return {
    result,
    mode: edited ? "edit" : "edit-fallback",
    sourceImageId,
    regionCount: parsed.regions?.length ?? 0,
  };
}

async function createNewImage({
  notebook,
  parsed,
  orgSlug,
  backend,
  toolCallId,
}: ImageRun) {
  const { image } = await generateNotebookImage({
    prompt: parsed.prompt ?? "",
    orgSlug,
    aspectRatio: parsed.aspectRatio,
    backend,
  });
  const result = await createGeneratedImage({
    notebookId: notebook.id,
    prompt: parsed.prompt ?? "",
    alt: parsed.alt,
    buffer: image.uint8Array,
    sourceByteSize: image.uint8Array.byteLength,
    aspectRatio: parsed.aspectRatio,
    toolCallId,
  });
  return { result };
}

async function generateImage(
  notebookId: string | undefined,
  userId: string,
  orgSlug: string | undefined,
  input: GenerateImageInput,
  toolCallId?: string,
) {
  const parsed = generateImageInputSchema.parse(input);
  const startedAt = Date.now();

  if (!notebookId || !orgSlug) {
    throw new Error("generateImage requires an active notebook context.");
  }

  const { notebook } = await resolveNotebookInOrg(notebookId, userId, orgSlug);

  if (toolCallId) {
    const alreadyGenerated = await findGeneratedImageByToolCall(
      notebook.id,
      toolCallId,
    );
    if (alreadyGenerated) return alreadyGenerated;
  }

  const backend = await resolveImageGenerationBackend(orgSlug);
  const run = { notebook, parsed, orgSlug, backend, toolCallId };

  try {
    const generated = await chargeImageGeneration(
      {
        userId,
        organizationId: notebook.organizationId,
        notebookId: notebook.id,
        byoai: backend.kind === "byoai",
      },
      () =>
        parsed.sourceImageId
          ? createEditedImage(run, parsed.sourceImageId)
          : createNewImage(run),
    );
    const { result, ...generationDetails } = generated;

    logImageGeneration({
      userId,
      orgId: notebook.organizationId,
      notebookId: notebook.id,
      backend: backend.kind,
      ...generationDetails,
      durationMs: Date.now() - startedAt,
      byteSize: result.byteSize,
      success: true,
      toolCallId,
    });

    return result;
  } catch (error) {
    logImageGeneration({
      userId,
      orgId: notebook.organizationId,
      notebookId: notebook.id,
      durationMs: Date.now() - startedAt,
      success: false,
      toolCallId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function buildImageNotebookTools(ctx: ImageNotebookToolContext) {
  const userId = ctx.session.user.id;

  return {
    listNotebookMedia: tool({
      description:
        "List images in this notebook's media library (newest first). Use before generateImage when the user may already have a suitable illustration — reuse an existing item's url with insertContent instead of generating duplicates. " +
        "Paginate with cursor and nextCursor when the library is large.",
      inputSchema: listNotebookMediaInputSchema,
      outputSchema: listNotebookMediaOutputSchema,
      execute: async (input) =>
        serializeToolResult(
          await listNotebookMedia(ctx.notebookId, userId, ctx.orgSlug, input),
        ),
    }),
    generateImage: tool({
      description:
        "Generate an illustration or diagram for course content, or refine an existing one. Always provide concise alt text (accessibility and media-library reuse). " +
        "To REFINE an existing image (e.g. localized comments from the image editor), set sourceImageId to that image's imageId and pass the localized edits as `regions` — copy each region's x/y, radius, and text EXACTLY as given, preserving decimals (e.g. 37.3, not 37); do not round, reorder, merge, or invent positions. The backend marks those exact points on the image so the model edits only those spots and keeps the rest unchanged. Use `prompt` only for a global change; keep it short and never restate coordinates in it. " +
        "The chat UI renders the result inline automatically — never embed the image in your text reply: no markdown images (![]()), no raw URLs, and no alt-text captions pasted as images. " +
        "After the tool completes, write a brief text-only closing message (confirm it is ready; optionally mention the media library or Insert into scene). " +
        "Use insertContent with the returned URL only when the user explicitly asks you to place the image in a scene.",
      inputSchema: generateImageInputSchema,
      outputSchema: generateImageOutputSchema,
      execute: async (input, options) =>
        serializeToolResult(
          await generateImage(
            ctx.notebookId,
            userId,
            ctx.orgSlug,
            input,
            options.toolCallId,
          ),
        ),
    }),
  };
}
