import type { Prisma } from "@scibly/db";
import type { JSONContent } from "@tiptap/core";

import { getSchema, Node } from "@tiptap/core";
import { prosemirrorJSONToYDoc } from "@tiptap/y-tiptap";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { publishCourseSnapshot } from "./publish-course-snapshot";

const schema = getSchema([
  Node.create({ name: "doc", topNode: true, content: "block+" }),
  Node.create({ name: "paragraph", group: "block", content: "text*" }),
  Node.create({ name: "text", group: "inline" }),
  ...[INPUT_FIELD_NODE_NAME, MULTIPLE_CHOICE_NODE_NAME].map((name) =>
    Node.create({
      name,
      group: "block",
      atom: true,
      addAttributes: () => ({
        id: { default: null },
        isQuestionBlock: { default: true },
        questionBlockAttributes: { default: null },
      }),
    }),
  ),
]);

function documentOf(content: JSONContent[]): Buffer {
  return Buffer.from(
    Y.encodeStateAsUpdate(
      prosemirrorJSONToYDoc(schema, { type: "doc", content }, "default"),
    ),
  );
}

function proseDocument(): Buffer {
  return documentOf([
    { type: "paragraph", content: [{ type: "text", text: "Read this." }] },
  ]);
}

function unstrippableQuestionDocument(): Buffer {
  return documentOf([
    {
      type: MULTIPLE_CHOICE_NODE_NAME,
      attrs: {
        id: "mc-1",
        isQuestionBlock: true,
        questionBlockAttributes: {
          optional: false,
          maxPoints: 4,
          sp: 10,
          questionData: {
            choices: [{ id: "c1", text: "Lisbon" }],
            correctChoiceIds: ["c1"],
            allowMultiple: false,
            hintForTheAnswer: "c1",
          },
        },
      },
    },
  ]);
}

const DRAFT_SCENE = {
  id: "scene-1",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  title: "Scene",
  sp: 5,
  documentState: proseDocument(),
  integration: null,
};

function draftScene(overrides: Partial<typeof DRAFT_SCENE> = {}) {
  return { ...DRAFT_SCENE, ...overrides };
}

const DRAFT_LESSON = {
  id: "lesson-1",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  title: "Lesson",
  order: 0,
  courseId: "course-1",
  design: null as Prisma.JsonValue,
  scenes: [draftScene()],
};

function draftLesson(overrides: Partial<typeof DRAFT_LESSON> = {}) {
  return { ...DRAFT_LESSON, ...overrides };
}

type CapturedCalls = {
  courseVersionCreate?: Prisma.CourseVersionCreateArgs;
  lessonCreateMany?: Prisma.LessonCreateManyArgs;
  sceneCreateMany?: Prisma.SceneCreateManyArgs;
  courseVersionUpdateMany?: Prisma.CourseVersionUpdateManyArgs;
};

function fakeTx(config: {
  draftLessons: unknown[];
  latestVersion: { id: string; version: number; publishedAt: Date } | null;
}) {
  const calls: CapturedCalls = {};
  const tx = {
    lesson: {
      findMany: () => Promise.resolve(config.draftLessons),
      createMany: (args: Prisma.LessonCreateManyArgs) => {
        calls.lessonCreateMany = args;
        return Promise.resolve({
          count: Array.isArray(args.data) ? args.data.length : 1,
        });
      },
    },
    scene: {
      createMany: (args: Prisma.SceneCreateManyArgs) => {
        calls.sceneCreateMany = args;
        return Promise.resolve({
          count: Array.isArray(args.data) ? args.data.length : 1,
        });
      },
    },
    courseVersion: {
      findFirst: () => Promise.resolve(config.latestVersion),
      create: (args: Prisma.CourseVersionCreateArgs) => {
        calls.courseVersionCreate = args;
        return Promise.resolve({ id: "new-version", ...args.data });
      },
      updateMany: (args: Prisma.CourseVersionUpdateManyArgs) => {
        calls.courseVersionUpdateMany = args;
        return Promise.resolve({ count: 0 });
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { tx, calls };
}

describe("PCS1: the no-changes gate", () => {
  it("PCS1: refuses a republish when nothing has changed since the last publish", async () => {
    const publishedAt = new Date("2026-01-01T00:00:00Z");
    const { tx } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: publishedAt,
          scenes: [draftScene({ updatedAt: publishedAt })],
        }),
      ],
      latestVersion: { id: "v1", version: 1, publishedAt },
    });

    await expect(
      publishCourseSnapshot(
        tx,
        { id: "course-1", updatedAt: publishedAt },
        "user-1",
        {
          supersedePrevious: false,
        },
      ),
    ).rejects.toThrow(/no changes/i);
  });

  it("PCS6: force does not waive the no-changes gate", async () => {
    const publishedAt = new Date("2026-01-01T00:00:00Z");
    const { tx } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: publishedAt,
          scenes: [draftScene({ updatedAt: publishedAt })],
        }),
      ],
      latestVersion: { id: "v1", version: 1, publishedAt },
    });

    await expect(
      publishCourseSnapshot(
        tx,
        { id: "course-1", updatedAt: publishedAt },
        "user-1",
        {
          supersedePrevious: false,
          force: true,
        },
      ),
    ).rejects.toThrow(/no changes/i);
  });
});

describe("design travels on the lesson, not the scene", () => {
  it("the snapshot copies the lesson's palette and stamps none on scenes", async () => {
    const changedAt = new Date("2026-02-01T00:00:00Z");
    const design = {
      backgroundColor: "#ffffff",
      textColor: "#131c46",
      primaryColor: "#0066ff",
      fontFamily: "var(--font-sans)",
    };
    const { tx, calls } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: changedAt,
          design,
          scenes: [draftScene({ updatedAt: changedAt })],
        }),
      ],
      latestVersion: null,
    });

    await publishCourseSnapshot(
      tx,
      { id: "course-1", updatedAt: changedAt },
      "user-1",
      { supersedePrevious: false },
    );

    const lessons = calls.lessonCreateMany?.data as Array<{ design?: unknown }>;
    const scenes = calls.sceneCreateMany?.data as Prisma.SceneCreateManyInput[];
    expect(lessons[0].design).toEqual(design);
    expect(scenes[0]).not.toHaveProperty("design");
  });
});

describe("PCS2/PCS3: version numbering", () => {
  it.each([
    {
      name: "a course's first publish gets version 1, unblocked by the no-changes rule",
      latestVersion: null,
      expectedVersion: 1,
    },
    {
      name: "a publish after real changes gets the next sequential version",
      latestVersion: {
        id: "v1",
        version: 1,
        publishedAt: new Date("2026-01-01T00:00:00Z"),
      },
      expectedVersion: 2,
    },
  ] as const)(
    "PCS2/PCS3: $name",
    async ({ latestVersion, expectedVersion }) => {
      const changedAt = new Date("2026-02-01T00:00:00Z");
      const { tx, calls } = fakeTx({
        draftLessons: [
          draftLesson({
            updatedAt: changedAt,
            scenes: [draftScene({ updatedAt: changedAt })],
          }),
        ],
        latestVersion,
      });

      const result = await publishCourseSnapshot(
        tx,
        { id: "course-1", updatedAt: changedAt },
        "user-1",
        { supersedePrevious: false },
      );

      expect(result.version).toBe(expectedVersion);
      expect(calls.courseVersionCreate?.data.version).toBe(expectedVersion);
    },
  );
});

describe("PCS4: one unbuildable scene aborts the whole publish", () => {
  it("PCS4: throws and never reaches scene creation or invalidation", async () => {
    const changedAt = new Date("2026-02-01T00:00:00Z");
    const { tx, calls } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: changedAt,
          scenes: [
            draftScene({ id: "scene-1", updatedAt: changedAt }),
            draftScene({
              id: "scene-2",
              updatedAt: changedAt,
              documentState: unstrippableQuestionDocument(),
            }),
          ],
        }),
      ],
      latestVersion: null,
    });

    await expect(
      publishCourseSnapshot(
        tx,
        { id: "course-1", updatedAt: changedAt },
        "user-1",
        {
          supersedePrevious: true,
        },
      ),
    ).rejects.toThrow(/failed to process scene/i);

    expect(calls.sceneCreateMany).toBeUndefined();
    expect(calls.courseVersionUpdateMany).toBeUndefined();
  });
});

describe("PCS5: supersedePrevious cascade", () => {
  it("PCS5: marks every version of this course up to the latest as superseded when requested", async () => {
    const changedAt = new Date("2026-02-01T00:00:00Z");
    const latestVersion = {
      id: "v3",
      version: 3,
      publishedAt: new Date("2026-01-01T00:00:00Z"),
    };
    const { tx, calls } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: changedAt,
          scenes: [draftScene({ updatedAt: changedAt })],
        }),
      ],
      latestVersion,
    });

    await publishCourseSnapshot(
      tx,
      { id: "course-1", updatedAt: changedAt },
      "user-1",
      {
        supersedePrevious: true,
      },
    );

    expect(calls.courseVersionUpdateMany).toEqual({
      where: { courseId: "course-1", version: { lte: 3 } },
      data: { superseded: true },
    });
  });

  it("PCS5: touches no version when supersedePrevious is not requested", async () => {
    const changedAt = new Date("2026-02-01T00:00:00Z");
    const latestVersion = {
      id: "v3",
      version: 3,
      publishedAt: new Date("2026-01-01T00:00:00Z"),
    };
    const { tx, calls } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: changedAt,
          scenes: [draftScene({ updatedAt: changedAt })],
        }),
      ],
      latestVersion,
    });

    await publishCourseSnapshot(
      tx,
      { id: "course-1", updatedAt: changedAt },
      "user-1",
      {
        supersedePrevious: false,
      },
    );

    expect(calls.courseVersionUpdateMany).toBeUndefined();
  });
});

describe("P0.1: a published PRACTICE row", () => {
  const PRACTICE_SOLUTION = { answer: { value: 42, points: 3 } };

  const PRACTICE_HTML =
    '<div id="app"></div><script>' +
    "window.scibly.submit({ answer: 42 });" +
    "window.scibly.onGraded(() => {});" +
    "window.__sciblySelfTest = () => ({ answer: 42 });" +
    "</script>";

  type PracticeOverrides = {
    practiceHtml?: string;
    practiceSolution?: unknown;
    practiceExplain?: string;
  };

  function practiceDraftScene(overrides: PracticeOverrides = {}) {
    return draftScene({
      id: "practice-1",
      updatedAt: new Date("2026-02-01T00:00:00Z"),
      documentState: null,
      kind: "PRACTICE",
      practiceHtml: PRACTICE_HTML,
      practiceSolution: PRACTICE_SOLUTION,
      practiceExplain: "Because 42.",
      ...overrides,
    } as unknown as Partial<typeof DRAFT_SCENE>);
  }

  async function publishPractice(overrides: PracticeOverrides = {}) {
    const changedAt = new Date("2026-02-01T00:00:00Z");
    const { tx, calls } = fakeTx({
      draftLessons: [
        draftLesson({
          updatedAt: changedAt,
          scenes: [practiceDraftScene(overrides)],
        }),
      ],
      latestVersion: null,
    });
    await publishCourseSnapshot(
      tx,
      { id: "course-1", updatedAt: changedAt },
      "user-1",
      { supersedePrevious: false },
    );
    return (calls.sceneCreateMany?.data as Prisma.SceneCreateManyInput[])[0]!;
  }

  it("carries the app fragment as learnerContent and the key as gradingManifest", async () => {
    const published = await publishPractice();
    expect(published.learnerContent).toBe(PRACTICE_HTML);
    expect(published.gradingManifest).toEqual({
      solution: PRACTICE_SOLUTION,
      explain: "Because 42.",
    });
  });

  it("summarizes hasQuestions/maxSp from the solution's field points", async () => {
    const published = await publishPractice();
    expect(published.hasQuestions).toBe(true);
    // draftScene()'s sp is 5, plus the single 3-point solution field.
    expect(published.maxSp).toBe(8);
  });

  it("leaves the draft-only practice columns off the row", async () => {
    const published = await publishPractice();
    // A copy here would be a second answer key on a row learner-facing queries reach.
    expect(published.practiceSolution).toBeUndefined();
    expect(published.practiceHtml).toBeUndefined();
    expect(published.practiceExplain).toBeUndefined();
  });

  it("refuses an app rewritten into something that no longer submits", async () => {
    await expect(
      publishPractice({ practiceHtml: "<div>rewritten</div>" }),
    ).rejects.toThrow(/never calls window.scibly.submit/);
  });

  it("refuses an answer key the app never mentions", async () => {
    await expect(
      publishPractice({
        practiceSolution: { verdict: { value: 7, points: 3 } },
      }),
    ).rejects.toThrow(/never mentions the solution field/);
  });

  it("publishes when only the explanation changed — prose cannot break the app", async () => {
    const published = await publishPractice({ practiceExplain: "Reworded." });
    expect(published.gradingManifest).toEqual({
      solution: PRACTICE_SOLUTION,
      explain: "Reworded.",
    });
  });
});
