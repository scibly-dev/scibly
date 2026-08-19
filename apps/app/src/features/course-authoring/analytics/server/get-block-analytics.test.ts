import type { Prisma } from "@scibly/db";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

import { getBlockAnalyticsHelper } from "./get-block-analytics";

// The db is mocked so `sceneSelect` can assert which column a report is
// built from; the parser registry stays real to exercise actual formatting.

interface BlockAnalyticsRows {
  scene: { gradingManifest: unknown } | null;
  analytics: {
    enrollmentId: string | null;
    anonymousSessionId: string | null;
    gradedBlocks: unknown;
  }[];
}

const rows: BlockAnalyticsRows = { scene: null, analytics: [] };

const sceneSelect = vi.fn<(select: Prisma.SceneSelect) => void>();

vi.mock("@scibly/db", () => ({
  db: {
    scene: {
      findUnique: async (args: { select: Prisma.SceneSelect }) => {
        sceneSelect(args.select);
        return rows.scene;
      },
    },
    sceneAnalytics: { findMany: async () => rows.analytics },
  },
  Prisma: { AnyNull: "AnyNull" },
}));

const INPUT = { courseId: "course-1", sceneId: "published-scene-1" };

const PUBLISHED_MANIFEST = [
  {
    blockId: "block-1",
    blockType: INPUT_FIELD_NODE_NAME,
    questionData: { answer: "mitochondrion" },
    sp: 25,
  },
];

const GRADED_ROW = {
  enrollmentId: "enrollment-1",
  anonymousSessionId: null,
  gradedBlocks: [
    {
      blockId: "block-1",

      blockType: "stale-block-type",
      achievedPoints: 1,
      maxPoints: 1,
      spEarned: 25,
      learnerAnswer: "chloroplast",
    },
  ],
};

beforeEach(() => {
  rows.scene = null;
  rows.analytics = [];
  sceneSelect.mockClear();
});

describe("SOL20: a block report is built from the published answer key", () => {
  it("takes the question's type, points and correct answer from the manifest", async () => {
    rows.scene = { gradingManifest: PUBLISHED_MANIFEST };
    rows.analytics = [GRADED_ROW];

    const [block] = await getBlockAnalyticsHelper(INPUT);

    expect(block).toMatchObject({
      blockId: "block-1",
      blockType: INPUT_FIELD_NODE_NAME,
      maxPoints: 25,
      correctAnswer: "mitochondrion",
    });
  });

  it("never asks for the authoring document", async () => {
    rows.scene = { gradingManifest: PUBLISHED_MANIFEST };
    rows.analytics = [GRADED_ROW];

    await getBlockAnalyticsHelper(INPUT);

    expect(sceneSelect).toHaveBeenCalledWith({ gradingManifest: true });
  });

  it("reports nothing at all when nobody has answered the scene", async () => {
    rows.scene = { gradingManifest: PUBLISHED_MANIFEST };
    rows.analytics = [];

    await expect(getBlockAnalyticsHelper(INPUT)).resolves.toEqual([]);
  });
});

describe("SOL21: a question is named by the answer key, not by the submission", () => {
  it("refuses a graded row the answer key does not list", async () => {
    rows.scene = { gradingManifest: PUBLISHED_MANIFEST };
    rows.analytics = [
      {
        ...GRADED_ROW,
        gradedBlocks: [
          {
            ...GRADED_ROW.gradedBlocks[0],
            blockId: "block-that-was-never-published",
          },
        ],
      },
    ];

    await expect(getBlockAnalyticsHelper(INPUT)).rejects.toMatchObject({
      applicationCode: "analytics.block_not_in_manifest",
    });
  });

  it("refuses a scene with no answer key once anyone has answered it", async () => {
    rows.scene = { gradingManifest: null };
    rows.analytics = [GRADED_ROW];

    await expect(getBlockAnalyticsHelper(INPUT)).rejects.toMatchObject({
      applicationCode: "analytics.block_not_in_manifest",
    });
  });
});

describe("SP1: a question's maximum SP is exactly what the manifest says", () => {
  it("reports the manifest's sp even when a row carries no achieved/max points at all", async () => {
    rows.scene = { gradingManifest: PUBLISHED_MANIFEST };
    rows.analytics = [
      {
        ...GRADED_ROW,
        gradedBlocks: [
          {
            blockId: "block-1",
            spEarned: 25,
            learnerAnswer: "chloroplast",
          },
        ],
      },
    ];

    const [block] = await getBlockAnalyticsHelper(INPUT);

    expect(block).toMatchObject({ maxPoints: 25 });
  });
});

describe("SP2: a manifest missing sp refuses the report", () => {
  it("refuses rather than estimating a value", async () => {
    rows.scene = {
      gradingManifest: [{ ...PUBLISHED_MANIFEST[0], sp: undefined }],
    };
    rows.analytics = [GRADED_ROW];

    await expect(getBlockAnalyticsHelper(INPUT)).rejects.toMatchObject({
      applicationCode: "analytics.block_missing_sp",
    });
  });

  it("refuses a manifest entry authored with sp of exactly 0, the same as a missing one", async () => {
    rows.scene = {
      gradingManifest: [{ ...PUBLISHED_MANIFEST[0], sp: 0 }],
    };
    rows.analytics = [GRADED_ROW];

    await expect(getBlockAnalyticsHelper(INPUT)).rejects.toMatchObject({
      applicationCode: "analytics.block_missing_sp",
    });
  });
});

describe("SP3: a graded row missing its recorded SP earned refuses the report", () => {
  it("refuses rather than estimating one from achieved/max points", async () => {
    rows.scene = { gradingManifest: PUBLISHED_MANIFEST };
    rows.analytics = [
      {
        ...GRADED_ROW,
        gradedBlocks: [
          {
            blockId: "block-1",
            achievedPoints: 1,
            maxPoints: 1,
            learnerAnswer: "chloroplast",
          },
        ],
      },
    ];

    await expect(getBlockAnalyticsHelper(INPUT)).rejects.toMatchObject({
      applicationCode: "analytics.block_missing_sp_earned",
    });
  });
});
