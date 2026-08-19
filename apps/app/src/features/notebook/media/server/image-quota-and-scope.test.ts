import type { Prisma } from "@scibly/db";
import type { GenerateImageInput } from "@/features/notebook/media/tools/image-schemas";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatError } from "@/shared/ai/errors";

// The rate limiter and entitlement seam are real; only DB, image gateway, backend resolution, S3, and compressor are mocked.
const counter = await vi.hoisted(async () =>
  (await import("@test/mocks/rate-limit-counter")).rateLimitCounter(),
);

const db = vi.hoisted(() => ({
  notebook: { findUnique: vi.fn() },
  notebookGeneratedImage: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  rateLimit: counter.model,
  organizationSubscription: { findUnique: vi.fn() },
  organizationCredit: { updateMany: vi.fn(), findUnique: vi.fn() },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },

  $transaction: vi.fn(async (arg: unknown) =>
    typeof arg === "function"
      ? arg(db)
      : Promise.all(arg as Promise<unknown>[]),
  ),
}));

const s3 = vi.hoisted(() => ({ s3Client: { send: vi.fn() } }));

const gateway = vi.hoisted(() => ({
  generateNotebookImage: vi.fn(),
  editNotebookImage: vi.fn(),
}));

const registry = vi.hoisted(() => ({ resolveImageGenerationBackend: vi.fn() }));

const access = vi.hoisted(() => ({ resolveNotebookInOrg: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/lib/file/s3", () => s3);
vi.mock("@/lib/file/compress-image-server", () => ({
  compressImageBufferForUpload: vi.fn(async () => ({
    buffer: Buffer.from("compressed"),
    mediaType: "image/webp" as const,
    width: 1024,
    height: 576,
    byteSize: 4096,
  })),
}));
vi.mock("@/features/notebook/media/server/generate-notebook-image", () => ({
  generateNotebookImage: gateway.generateNotebookImage,
}));
vi.mock("@/features/notebook/media/server/edit-notebook-image", () => ({
  editNotebookImage: gateway.editNotebookImage,
}));
vi.mock("@/shared/ai/server/models/registry", () => registry);
vi.mock("@/features/notebook/workspace/server/access", () => access);

const { db: prisma } = await import("@scibly/db");
const { chargeAiGeneration } = await import("@scibly/api/entitlement");
const { buildImageNotebookTools } =
  await import("../tools/image-notebook-tools");
const { assertGeneratedImageS3KeyInScope } =
  await import("./notebook-generated-image");
const { IMAGE_GENERATE_USER_LIMIT } = await import("./image-usage");

const USER = "user-1";
const ORG = "org-a";
const ORG_SLUG = "acme";
const NOTEBOOK = "nb-1";

const NOW = new Date("2026-07-27T14:37:11.000Z");
const HOUR_BUCKET = new Date("2026-07-27T14:00:00.000Z");

const GATEWAY_BACKEND = { kind: "gateway", model: {} };
const BYOAI_BACKEND = { kind: "byoai", model: {} };

const NEW_IMAGE: GenerateImageInput = {
  prompt: "a cross-section of a plant cell",
  alt: "Cross-section of a plant cell",
};
const EDIT: GenerateImageInput = {
  ...NEW_IMAGE,
  sourceImageId: "img-source",
  regions: [{ x: 37.3, y: 12, instruction: "label the nucleus" }],
};

const STORED_ROW = {
  id: "img-1",
  prompt: NEW_IMAGE.prompt,
  alt: NEW_IMAGE.alt,
  s3Key: `notebook-media/${ORG}/${NOTEBOOK}/existing.webp`,
  width: 1024,
  height: 576,
  byteSize: 4096,
  aspectRatio: null,
  toolCallId: "call-1",
  createdAt: NOW,
};

function storedRow(overrides: Partial<typeof STORED_ROW> = {}) {
  return { ...STORED_ROW, ...overrides };
}

async function generate(
  input: GenerateImageInput = NEW_IMAGE,
  options: { toolCallId?: string; withoutNotebook?: boolean } = {},
) {
  const tools = buildImageNotebookTools({
    notebookId: options.withoutNotebook ? undefined : NOTEBOOK,
    orgSlug: ORG_SLUG,
    session: { user: { id: USER } },
  });
  const execute = tools.generateImage.execute;
  if (!execute) throw new Error("generateImage has no server executor");
  const result = await execute(input, {
    toolCallId: options.toolCallId ?? "call-1",
    messages: [],

    context: {},
  });
  if (Symbol.asyncIterator in result) {
    throw new Error("A generation returns one image, not a stream.");
  }
  return result;
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof ChatError) return error.applicationCode;
    throw error;
  }
  throw new Error("expected the generation to be refused, but it resolved");
}

function emptyPool() {
  db.organizationCredit.updateMany.mockResolvedValue({ count: 0 });
}

function chargedActions(): string[] {
  return db.creditLedgerEntry.create.mock.calls.map(
    (call) => (call[0] as { data: { action: string } }).data.action,
  );
}

function uploadedKey(): string | undefined {
  const put = s3.s3Client.send.mock.calls
    .map(([command]) => command)
    .find((command): command is PutObjectCommand => {
      return command instanceof PutObjectCommand;
    });
  return put?.input.Key;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.resetAllMocks();

  access.resolveNotebookInOrg.mockResolvedValue({
    notebook: { id: NOTEBOOK, organizationId: ORG },
  });
  db.notebook.findUnique.mockResolvedValue({ organizationId: ORG });

  db.notebookGeneratedImage.findFirst.mockImplementation(
    async ({ where }: { where: { toolCallId?: string; id?: string } }) =>
      where.toolCallId ? null : storedRow({ id: where.id }),
  );
  db.notebookGeneratedImage.create.mockImplementation(
    async ({ data }: { data: Prisma.NotebookGeneratedImageCreateInput }) => ({
      ...storedRow(),
      ...data,
    }),
  );
  counter.clear();
  db.organizationSubscription.findUnique.mockResolvedValue({ plan: "STARTER" });
  db.organizationCredit.updateMany.mockResolvedValue({ count: 1 });
  db.organizationCredit.findUnique.mockResolvedValue({ id: "credit-1" });
  db.creditLedgerEntry.create.mockImplementation(async () => ({
    id: `entry-${db.creditLedgerEntry.create.mock.calls.length}`,
  }));
  db.creditLedgerEntry.update.mockResolvedValue({});

  s3.s3Client.send.mockImplementation(async (command: unknown) => {
    if (command instanceof GetObjectCommand) {
      return {
        Body: {
          transformToByteArray: async () => new Uint8Array([1, 2, 3]),
        },
      };
    }
    return {};
  });

  registry.resolveImageGenerationBackend.mockResolvedValue(GATEWAY_BACKEND);
  gateway.generateNotebookImage.mockResolvedValue({
    image: { uint8Array: new Uint8Array([4, 5, 6]) },
  });
  gateway.editNotebookImage.mockResolvedValue({
    image: { uint8Array: new Uint8Array([7, 8, 9]) },
    edited: true,
    instruction: "label the nucleus",
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GQ1/GQ2 — what one image costs the shared pool", () => {
  it("GQ1: one image debits exactly one generation from the notebook's organization", async () => {
    await generate();

    expect(db.organizationCredit.updateMany).toHaveBeenCalledTimes(1);
    expect(db.organizationCredit.updateMany).toHaveBeenCalledWith({
      where: { organizationId: ORG, allowanceRemaining: { gte: 1 } },
      data: { allowanceRemaining: { decrement: 1 } },
    });
  });

  it("GQ1: the ledger records it as an IMAGE_GENERATION against the notebook and the caller", async () => {
    await generate();

    expect(db.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: ORG,
        actorId: USER,
        notebookId: NOTEBOOK,
        action: "IMAGE_GENERATION",
        creditsCharged: 1,
      }),
    });
  });

  it("GQ2: a turn that generates three images leaves four ledger entries", async () => {
    await chargeAiGeneration(
      {
        db: prisma,
        organizationId: ORG,
        actorId: USER,
        action: "CHAT_MESSAGE",
        notebookId: NOTEBOOK,
      },
      async () => {
        await generate(NEW_IMAGE, { toolCallId: "call-1" });
        await generate(NEW_IMAGE, { toolCallId: "call-2" });
        await generate(NEW_IMAGE, { toolCallId: "call-3" });
      },
    );

    expect(chargedActions()).toEqual([
      "CHAT_MESSAGE",
      "IMAGE_GENERATION",
      "IMAGE_GENERATION",
      "IMAGE_GENERATION",
    ]);
  });
});

describe("GQ3/GQ9 — being refused, and in which order", () => {
  it("GQ3: an empty pool is refused in the pool's own vocabulary, before the gateway is called", async () => {
    emptyPool();

    expect(await refusal(() => generate())).toBe("quota_exceeded:credits");
    expect(gateway.generateNotebookImage).not.toHaveBeenCalled();
    expect(db.notebookGeneratedImage.create).not.toHaveBeenCalled();
  });

  it("GQ9: a user over their hourly cap is refused without the ledger moving at all", async () => {
    counter.setSpent(USER, "image.generate", IMAGE_GENERATE_USER_LIMIT);

    expect(await refusal(() => generate())).toBe("rate_limit:image");
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });
});

describe("GQ4/GQ5 — the user's hourly burst", () => {
  it("GQ4: a user at 30 attempts this hour is refused, as a rate limit", async () => {
    counter.setSpent(USER, "image.generate", IMAGE_GENERATE_USER_LIMIT);

    expect(await refusal(() => generate())).toBe("rate_limit:image");
    expect(gateway.generateNotebookImage).not.toHaveBeenCalled();
  });

  it("GQ4: a user one attempt short of the limit may still generate", async () => {
    counter.setSpent(USER, "image.generate", IMAGE_GENERATE_USER_LIMIT - 1);

    await generate();

    expect(gateway.generateNotebookImage).toHaveBeenCalledTimes(1);
  });

  it("GQ5: the burst is counted per user, per endpoint, over the current hour", async () => {
    await generate();

    expect(counter.keys()).toEqual([
      `${USER}|image.generate|${HOUR_BUCKET.toISOString()}`,
    ]);
  });
});

describe("GQ6 — a generation that fails costs nothing", () => {
  it("GQ6: a gateway failure moves no counter and refunds the debit", async () => {
    gateway.generateNotebookImage.mockRejectedValue(
      new Error("image backend unavailable"),
    );

    await expect(generate()).rejects.toThrow("image backend unavailable");

    expect(counter.spent(USER, "image.generate")).toBe(0);
    expect(db.organizationCredit.updateMany).toHaveBeenCalledWith({
      where: { organizationId: ORG },
      data: { allowanceRemaining: { increment: 1 } },
    });
    expect(db.creditLedgerEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: { refundedAt: expect.any(Date) },
    });
  });

  it("GQ6: a failure after the image was produced — the upload — also costs nothing", async () => {
    s3.s3Client.send.mockRejectedValue(new Error("bucket unreachable"));

    await expect(generate()).rejects.toThrow("bucket unreachable");

    expect(counter.spent(USER, "image.generate")).toBe(0);
    expect(db.creditLedgerEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: { refundedAt: expect.any(Date) },
    });
  });

  it("GQ6: a generation that succeeds charges the user exactly once", async () => {
    await generate();

    expect(counter.keys()).toEqual([
      `${USER}|image.generate|${HOUR_BUCKET.toISOString()}`,
    ]);
    expect(counter.spent(USER, "image.generate")).toBe(1);
    expect(db.creditLedgerEntry.update).not.toHaveBeenCalled();
  });
});

describe("GQ7 — a replayed tool call costs nothing", () => {
  it("GQ7: returns the image already stored for that call", async () => {
    db.notebookGeneratedImage.findFirst.mockResolvedValue(
      storedRow({ id: "img-already-there" }),
    );

    const result = await generate();

    expect(result).toMatchObject({ imageId: "img-already-there" });
  });

  it("GQ7: generates nothing and charges nothing", async () => {
    db.notebookGeneratedImage.findFirst.mockResolvedValue(storedRow());

    await generate();

    expect(gateway.generateNotebookImage).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
    expect(counter.keys()).toEqual([]);
  });

  it("GQ7: the replay is looked up within this notebook, by this call", async () => {
    db.notebookGeneratedImage.findFirst.mockResolvedValue(storedRow());

    await generate(NEW_IMAGE, { toolCallId: "call-42" });

    expect(db.notebookGeneratedImage.findFirst).toHaveBeenCalledWith({
      where: { notebookId: NOTEBOOK, toolCallId: "call-42" },
    });
  });
});

describe("GQ8 — refining an image costs what generating one costs", () => {
  it("GQ8: an edit is refused when the pool is empty", async () => {
    emptyPool();

    expect(await refusal(() => generate(EDIT))).toBe("quota_exceeded:credits");
    expect(gateway.editNotebookImage).not.toHaveBeenCalled();
  });

  it("GQ8: a successful edit debits one IMAGE_GENERATION, like a new image", async () => {
    await generate(EDIT);

    expect(gateway.editNotebookImage).toHaveBeenCalledTimes(1);
    expect(counter.spent(USER, "image.generate")).toBe(1);
    expect(chargedActions()).toEqual(["IMAGE_GENERATION"]);
  });
});

describe("GQ10 — an image off the organization's own endpoint is free", () => {
  beforeEach(() => {
    registry.resolveImageGenerationBackend.mockResolvedValue(BYOAI_BACKEND);

    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "BUSINESS",
    });
  });

  it("GQ10: nothing is debited and no ledger entry is written", async () => {
    await generate();

    expect(gateway.generateNotebookImage).toHaveBeenCalledTimes(1);
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("PL18: the subscription is still read — what BYOAI skips is the debit, not the entitlement", async () => {
    await generate();

    expect(db.organizationSubscription.findUnique).toHaveBeenCalledTimes(1);
  });

  it("GQ10: an empty pool does not stop it", async () => {
    emptyPool();

    await generate();

    expect(gateway.generateNotebookImage).toHaveBeenCalledTimes(1);
  });

  it("GQ10: the backend that priced the generation is the one handed to the gateway", async () => {
    await generate();

    expect(registry.resolveImageGenerationBackend).toHaveBeenCalledTimes(1);
    expect(gateway.generateNotebookImage).toHaveBeenCalledWith(
      expect.objectContaining({ backend: BYOAI_BACKEND }),
    );
  });

  it("GQ10: an edit resolves the backend once and runs on that same answer", async () => {
    await generate(EDIT);

    expect(registry.resolveImageGenerationBackend).toHaveBeenCalledTimes(1);
    expect(gateway.editNotebookImage).toHaveBeenCalledWith(
      expect.objectContaining({ backend: BYOAI_BACKEND }),
    );
  });
});

describe("GS1/GS4 — nothing happens without a notebook the caller may open", () => {
  it("GS1: a caller refused at the notebook boundary counts nothing and generates nothing", async () => {
    access.resolveNotebookInOrg.mockRejectedValue(new Error("Forbidden"));

    await expect(generate()).rejects.toThrow("Forbidden");
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(counter.keys()).toEqual([]);
    expect(gateway.generateNotebookImage).not.toHaveBeenCalled();
  });

  it("GS4: a generation with no active notebook is refused rather than stored", async () => {
    await expect(
      generate(NEW_IMAGE, { withoutNotebook: true }),
    ).rejects.toThrow(/active notebook/);
    expect(gateway.generateNotebookImage).not.toHaveBeenCalled();
    expect(s3.s3Client.send).not.toHaveBeenCalled();
  });
});

describe("GS2/GS3 — where the image lands", () => {
  it("GS2: the key sits under the notebook's own organization and notebook", async () => {
    await generate();

    const key = uploadedKey();
    expect(key).toMatch(
      new RegExp(`^notebook-media/${ORG}/${NOTEBOOK}/[0-9a-f-]+\\.webp$`),
    );

    expect(() =>
      assertGeneratedImageS3KeyInScope(key ?? "", ORG, NOTEBOOK),
    ).not.toThrow();
  });

  it("GS2: the organization comes from the notebook row, not from the caller", async () => {
    db.notebook.findUnique.mockResolvedValue({ organizationId: "org-truth" });

    await generate();

    expect(db.notebook.findUnique).toHaveBeenCalledWith({
      where: { id: NOTEBOOK },
      select: { organizationId: true },
    });
    expect(uploadedKey()).toContain(`notebook-media/org-truth/${NOTEBOOK}/`);
  });

  it("GS2: a notebook that no longer exists at write time stores nothing", async () => {
    db.notebook.findUnique.mockResolvedValue(null);

    await expect(generate()).rejects.toThrow(/Notebook not found/);
    expect(uploadedKey()).toBeUndefined();
    expect(db.notebookGeneratedImage.create).not.toHaveBeenCalled();
  });

  it("GS3: the row belongs to the notebook and carries the call it came from", async () => {
    await generate(NEW_IMAGE, { toolCallId: "call-7" });

    expect(db.notebookGeneratedImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        notebookId: NOTEBOOK,
        toolCallId: "call-7",
        alt: NEW_IMAGE.alt,
      }),
    });
  });
});
