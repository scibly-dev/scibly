import type { Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import { requireOrgMember } from "@/features/organizations/server";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

import { previewScene } from "./preview-scene";

// The db mock doubles as the assertion instrument: "preview makes no write"
// is only observable by watching the writes that could happen.

interface PreviewSceneRows {
  lesson: { course: { organizationId: string } } | null;
  scene: { documentState: Buffer | null; sp: number | null } | null;
}

const rows: PreviewSceneRows = { lesson: null, scene: null };

const queries = {
  scene: vi.fn<(where: Prisma.SceneWhereInput) => void>(),
};

const writeSpies = {
  "sceneProgress.upsert": vi.fn(),
  "sceneProgress.create": vi.fn(),
  "sceneAnalytics.upsert": vi.fn(),
  "sceneAnalytics.create": vi.fn(),
  "courseEnrollment.update": vi.fn(),
  $transaction: vi.fn(),
};

vi.mock("@scibly/db", () => ({
  db: {
    lesson: { findUnique: async () => rows.lesson },
    scene: {
      findFirst: async (args: { where: Prisma.SceneWhereInput }) => {
        queries.scene(args.where);
        return rows.scene;
      },
    },
    sceneProgress: {
      upsert: async () => writeSpies["sceneProgress.upsert"](),
      create: async () => writeSpies["sceneProgress.create"](),
    },
    sceneAnalytics: {
      upsert: async () => writeSpies["sceneAnalytics.upsert"](),
      create: async () => writeSpies["sceneAnalytics.create"](),
    },
    courseEnrollment: {
      update: async () => writeSpies["courseEnrollment.update"](),
    },
    $transaction: async () => writeSpies.$transaction(),
  },
}));

vi.mock("@/features/organizations/server", () => ({
  requireOrgMember: vi.fn(async () => MEMBERSHIP),
}));

const MEMBERSHIP = {
  id: "mem-1",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  userId: "user-1",
  organizationId: "org-1",
  role: "owner",
};

const AUTHOR = "user-1";
const INPUT = { lessonId: "l1", sceneId: "s1", blocks: [] };

const writesMade = (): string[] =>
  Object.entries(writeSpies)
    .filter(([, spy]) => spy.mock.calls.length > 0)
    .map(([name]) => name);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireOrgMember).mockResolvedValue(MEMBERSHIP);
  rows.lesson = { course: { organizationId: "org-1" } };
  rows.scene = { documentState: null, sp: 10 };
});

describe("previewing a scene", () => {
  it("SC23: an author previewing their own scene records nothing", async () => {
    await previewScene(AUTHOR, INPUT);

    expect(writesMade()).toEqual([]);
  });

  it("SC23: previewing still grades and answers", async () => {
    const result = await previewScene(AUTHOR, INPUT);

    expect(result.success).toBe(true);
    expect(result.gradedBlocks).toEqual([]);
  });

  it("SC23: preview stands behind the course's organization, at admin or owner", async () => {
    await previewScene(AUTHOR, INPUT);

    expect(requireOrgMember).toHaveBeenCalledWith(
      "org-1",
      AUTHOR,
      "admin_or_owner",
    );
  });

  it("SC23: a caller the organization refuses gets no scene and writes nothing", async () => {
    vi.mocked(requireOrgMember).mockRejectedValue(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "api.forbidden",
        message: "Not a member.",
      }),
    );

    await expect(previewScene(AUTHOR, INPUT)).rejects.toBeInstanceOf(AppError);

    expect(queries.scene).not.toHaveBeenCalled();
    expect(writesMade()).toEqual([]);
  });

  it("SC23: an unknown lesson is refused before anyone's membership is looked up", async () => {
    rows.lesson = null;

    await expect(previewScene(AUTHOR, INPUT)).rejects.toBeInstanceOf(AppError);

    expect(requireOrgMember).not.toHaveBeenCalled();
  });

  it("SC23: the scene previewed is the draft under edit in that lesson, not a published snapshot", async () => {
    await previewScene(AUTHOR, INPUT);

    expect(queries.scene).toHaveBeenCalledWith({
      id: "s1",
      lessonId: "l1",
      courseVersionId: null,
    });
  });

  it("SC23: a scene that does not resolve is refused rather than graded as empty", async () => {
    rows.scene = null;

    await expect(previewScene(AUTHOR, INPUT)).rejects.toBeInstanceOf(AppError);
  });

  describe("ANS15: preview is held to the learner's completeness rule", () => {
    function draftWithOneQuestion(optional?: boolean): Buffer {
      const document = new Y.Doc();
      const block = new Y.XmlElement(INPUT_FIELD_NODE_NAME);
      block.setAttribute("id", "b1");
      block.setAttribute("isQuestionBlock", "true");

      block.setAttribute(
        "questionBlockAttributes",
        JSON.stringify({
          questionData: { answer: "Paris", caseSensitive: false },
          optional,
        }),
      );
      document.getXmlFragment("default").insert(0, [block]);
      return Buffer.from(Y.encodeStateAsUpdate(document));
    }

    const answering = (learnerAnswer: unknown) => ({
      lessonId: "l1",
      sceneId: "s1",
      blocks: [
        { blockId: "b1", blockType: INPUT_FIELD_NODE_NAME, learnerAnswer },
      ],
    });

    it("an author leaving a required question blank is refused", async () => {
      rows.scene = { documentState: draftWithOneQuestion(), sp: 10 };

      await expect(previewScene(AUTHOR, answering(""))).rejects.toBeInstanceOf(
        AppError,
      );
    });

    it("an author answering it gets their preview graded", async () => {
      rows.scene = { documentState: draftWithOneQuestion(), sp: 10 };

      const result = await previewScene(AUTHOR, answering("Paris"));

      expect(result.gradedBlocks).toHaveLength(1);
    });

    it("a question the author marked optional may be left blank", async () => {
      rows.scene = { documentState: draftWithOneQuestion(true), sp: 10 };

      const result = await previewScene(AUTHOR, answering(""));

      expect(result.gradedBlocks).toHaveLength(1);
    });
  });

  describe("SOL18: a draft scene that cannot be read is refused, not graded as empty", () => {
    const neverSynchronized = Buffer.from("<p>Half-migrated</p>");

    it("an author previewing it is told, not congratulated", async () => {
      rows.scene = { documentState: neverSynchronized, sp: 10 };

      await expect(previewScene(AUTHOR, INPUT)).rejects.toBeInstanceOf(
        AppError,
      );
    });

    it("and told the scene could not be read, not handed a generic failure", async () => {
      rows.scene = { documentState: neverSynchronized, sp: 10 };

      await expect(previewScene(AUTHOR, INPUT)).rejects.toMatchObject({
        applicationCode: "progression.scene_unreadable",
      });
    });
  });
});
