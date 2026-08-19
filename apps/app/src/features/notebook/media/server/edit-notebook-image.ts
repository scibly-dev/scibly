import type { ImageGenerationBackend } from "@/shared/ai/server/models/registry";

import "server-only";
import { generateNotebookImage } from "@/features/notebook/media/server/generate-notebook-image";
import {
  DEFAULT_REGION_RADIUS,
  formatPercent,
  type ImageEditRegion,
} from "@/features/notebook/media/tools/image-schemas";
import { IMAGE_MODEL_TIMEOUT_MS } from "@/shared/ai/server/models/registry";

import { callGatewayImageModel } from "./gateway-image-model";
import {
  annotateRegions,
  normalizeImageForEdit,
  preserveUnmarkedRegions,
} from "./region-edit";

function logImageBackend(
  event: Record<string, string | number | boolean | undefined>,
) {
  console.info("[edit-notebook-image]", event);
}

interface EditNotebookImageInput {
  sourceBytes: Uint8Array;
  prompt: string;
  regions: ImageEditRegion[];
  orgSlug: string;
  aspectRatio?: string;

  backend: ImageGenerationBackend;
}

function buildGroundedEditInstruction(
  prompt: string,
  regions: ImageEditRegion[],
): string {
  const lines: string[] = [];
  const trimmedPrompt = prompt.trim();
  const hasGlobalChange = trimmedPrompt.length > 0;

  if (regions.length > 0) {
    if (hasGlobalChange) {
      lines.push(
        "This image has numbered magenta circles marking localized edits. Apply EVERY numbered change inside its matching circle, making each change clearly visible. Then REMOVE every magenta circle and number from the final image. Also apply the global change below anywhere it belongs in the image (outside the circles is allowed):",
      );
    } else {
      lines.push(
        "This image has numbered magenta circles drawn on it to mark where to edit. Apply each change below to the object inside the matching numbered circle, covering the whole object and making the change clearly visible. Then REMOVE every magenta circle and number so none of them appear in the final image. Do not change anything outside the marked areas. Do not add grain, noise, speckles, or dark spots to unchanged areas — keep backgrounds clean and flat:",
      );
    }

    regions.forEach((region, index) => {
      lines.push(`${index + 1}. ${region.instruction.trim()}`);
    });

    if (hasGlobalChange) {
      lines.push(`Global change: ${trimmedPrompt}`);
    }
  } else {
    lines.push(
      "Edit this image as follows, keeping the same overall composition, framing, and art style:",
    );
    if (hasGlobalChange) {
      lines.push(trimmedPrompt);
    }
  }

  return lines.join("\n");
}

function buildFallbackPrompt(
  prompt: string,
  regions: ImageEditRegion[],
): string {
  const lines: string[] = [];
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt) lines.push(trimmedPrompt);

  regions.forEach((region, index) => {
    lines.push(
      `Change ${index + 1} — near ${formatPercent(region.x)}% from the left, ${formatPercent(region.y)}% from the top: ${region.instruction}`,
    );
  });

  return lines.join("\n");
}

async function runGatewayEdit(
  input: EditNotebookImageInput,
  instruction: string,
) {
  const { sourceBytes, prompt, regions, orgSlug } = input;
  const abortSignal = AbortSignal.timeout(IMAGE_MODEL_TIMEOUT_MS);
  const normalized = await normalizeImageForEdit(sourceBytes);
  const markerRegions = regions.map((region) => ({
    x: region.x,
    y: region.y,
    radius: region.radius ?? DEFAULT_REGION_RADIUS,
  }));
  const combinedEdit = regions.length > 0 && prompt.trim().length > 0;
  if (regions.length === 0) {
    const result = await callGatewayImageModel({
      abortSignal,
      sourceImage: { bytes: normalized.bytes, mediaType: normalized.mediaType },
      instruction,
    });
    const image = {
      uint8Array: result.uint8Array,
      mediaType: "image/png" as const,
    };
    logImageBackend({
      orgSlug,
      backend: "gateway",
      mode: "edit",
      success: true,
    });
    return { image, edited: true, instruction };
  }
  const annotated = await annotateRegions(normalized.bytes, markerRegions);
  const editedBytes = (
    await callGatewayImageModel({
      abortSignal,
      sourceImage: { bytes: annotated.bytes, mediaType: annotated.mediaType },
      instruction,
    })
  ).uint8Array;
  const preserved = await preserveUnmarkedRegions(
    normalized.bytes,
    editedBytes,
    markerRegions,
    { retainGlobalChangesOutsideRegions: combinedEdit },
  );
  const image = { uint8Array: preserved.bytes, mediaType: preserved.mediaType };
  logImageBackend({
    orgSlug,
    backend: "gateway",
    mode: combinedEdit ? "edit-combined" : "edit",
    regionCount: regions.length,
    hasGlobalPrompt: prompt.trim().length > 0,
    retainedGlobalChangesOutsideRegions: combinedEdit,
    success: true,
  });
  return { image, edited: true, instruction };
}

export async function editNotebookImage({
  sourceBytes,
  prompt,
  regions,
  orgSlug,
  aspectRatio,
  backend,
}: EditNotebookImageInput): Promise<{
  image: { uint8Array: Uint8Array; mediaType?: string };
  edited: boolean;
  instruction: string;
}> {
  const instruction = buildGroundedEditInstruction(prompt, regions);

  if (backend.kind === "byoai") {
    logImageBackend({ orgSlug, backend: "byoai", mode: "edit-fallback" });
    const { image } = await generateNotebookImage({
      prompt: buildFallbackPrompt(prompt, regions),
      orgSlug,
      aspectRatio,
      backend,
    });
    return { image, edited: false, instruction };
  }

  try {
    return await runGatewayEdit(
      { sourceBytes, prompt, regions, orgSlug, aspectRatio, backend },
      instruction,
    );
  } catch (error) {
    logImageBackend({
      orgSlug,
      backend: "gateway",
      mode: "edit",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
