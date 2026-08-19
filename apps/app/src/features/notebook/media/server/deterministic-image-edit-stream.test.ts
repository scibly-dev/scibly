import type * as AiSdk from "ai";

import { describe, expect, it, vi } from "vitest";

import {
  GENERATION_CHARGED_ON_FAILURE_NOTICE,
  settleGenerationOnFailure,
} from "@/shared/ai/server/generation-settlement";

const sdk = vi.hoisted(() => ({
  createUIMessageStream:
    vi.fn<
      (params: {
        execute: (arg: { writer: unknown }) => Promise<void>;
        onError: (error: unknown) => string;
      }) => unknown
    >(),
  createUIMessageStreamResponse: vi.fn<() => Response>(),
}));

const generateImage = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof AiSdk>();
  return { ...actual, ...sdk };
});
vi.mock("@/features/notebook/server", () => ({
  buildImageNotebookTools: vi.fn(() => ({
    generateImage: { execute: generateImage },
  })),
}));

const { createDeterministicImageEditStreamResponse } =
  await import("./deterministic-image-edit-stream");

function imageEditStream({ byoai = false } = {}) {
  const refund = vi.fn(async () => {});
  const writer = { write: vi.fn() };
  sdk.createUIMessageStream.mockImplementation((params) => params);
  sdk.createUIMessageStreamResponse.mockReturnValue(new Response(null));

  createDeterministicImageEditStreamResponse({
    notebookId: "nb-1",
    orgSlug: "biology-dept",
    userId: "user-1",
    fullMessages: [],
    imageEdit: {
      prompt: "label the nucleus",
      alt: "Cell with labelled nucleus",
      sourceImageId: "img-1",
    },
    persistMessages: vi.fn(),
    correlationId: "corr-1",
    settlement: settleGenerationOnFailure(byoai ? null : { refund }),
  });

  const params = sdk.createUIMessageStream.mock.calls.at(-1)![0];
  return {
    ...params,
    refund,
    writer,
    edit: () => params.execute({ writer }),
    written: (type: string) =>
      writer.write.mock.calls.find(([part]) => part.type === type)?.[0],
  };
}

describe("what a failed image edit does to the generation it was charged for", () => {
  it("gives it back when no image came back", async () => {
    generateImage.mockRejectedValue(new Error("provider refused"));
    const stream = imageEditStream();

    await stream.edit();

    expect(stream.refund).toHaveBeenCalled();
    expect(stream.written("tool-output-error")).toMatchObject({
      errorText: expect.not.stringContaining(
        GENERATION_CHARGED_ON_FAILURE_NOTICE,
      ),
    });
  });

  it("keeps it once the image is out, whatever fails afterwards", async () => {
    generateImage.mockResolvedValue({ imageId: "img-2" });
    const stream = imageEditStream();
    await stream.edit();

    const message = stream.onError(new Error("writing the message failed"));

    expect(message).toContain(GENERATION_CHARGED_ON_FAILURE_NOTICE);
    expect(stream.refund).not.toHaveBeenCalled();
  });

  it("gives it back when the stream itself dies before any image", () => {
    const stream = imageEditStream();

    const message = stream.onError(new Error("image tool crashed"));

    expect(message).not.toContain(GENERATION_CHARGED_ON_FAILURE_NOTICE);
    expect(stream.refund).toHaveBeenCalled();
  });

  it("says nothing about a charge on a turn that never took one", () => {
    const stream = imageEditStream({ byoai: true });

    expect(stream.onError(new Error("image tool crashed"))).not.toContain(
      GENERATION_CHARGED_ON_FAILURE_NOTICE,
    );
  });
});
