import type { JSONContent } from "@tiptap/core";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

import { gradeSceneSubmissions } from "./grading";

// Only `db` is mocked; grading and parsing run for real, exercising the
// single path both `completeMemberScene` and `completeAnonymousScene` use.

const scenes: {
  learnerContent: JSONContent | null;
  gradingManifest: unknown;
}[] = [];

vi.mock("@scibly/db", () => ({
  db: {
    scene: {
      findMany: async () =>
        scenes.map((scene) => ({
          id: "s1",
          lessonId: "lesson-1",
          courseVersionId: "cv-1",
          sp: 10,
          ...scene,
        })),
    },
  },
}));

function publishedScene(optional?: boolean): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: INPUT_FIELD_NODE_NAME,
        attrs: {
          id: "b1",
          isQuestionBlock: true,
          questionBlockAttributes: {
            questionData: { answer: "X", caseSensitive: false },
            optional,
          },
        },
      },
    ],
  };
}

function submit(learnerAnswer: unknown) {
  return gradeSceneSubmissions(db, [
    {
      sceneId: "s1",
      blocks: [
        { blockId: "b1", blockType: INPUT_FIELD_NODE_NAME, learnerAnswer },
      ],
    },
  ]);
}

beforeEach(() => {
  scenes.length = 0;
  scenes.push({
    learnerContent: publishedScene(),
    gradingManifest: [
      {
        blockId: "b1",
        blockType: INPUT_FIELD_NODE_NAME,
        questionData: { answer: "Paris", caseSensitive: false },
      },
    ],
  });
});

describe("submitting a scene", () => {
  it("ANS10: a submission leaving a required question blank is refused before it is graded", async () => {
    await expect(submit("")).rejects.toBeInstanceOf(AppError);
  });

  it("ANS10: a submission that answers the scene is graded", async () => {
    const { results } = await submit("Paris");

    expect(results).toHaveLength(1);
  });

  it("ANS10: a hand-built submission with no blocks is refused", async () => {
    await expect(
      gradeSceneSubmissions(db, [{ sceneId: "s1", blocks: [] }]),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      gradeSceneSubmissions(db, [{ sceneId: "s1" }]),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("ANS14: whether the question was optional is read from the published scene", async () => {
    scenes[0]!.learnerContent = publishedScene(true);

    const { results } = await submit("");

    expect(results).toHaveLength(1);
  });

  it("ANS10: a scene whose published content cannot be read refuses the submission", async () => {
    scenes[0]!.learnerContent = null;

    await expect(submit("Paris")).rejects.toBeInstanceOf(AppError);
  });
});
