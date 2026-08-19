import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "@/features/notebook/course-builder/course-builder-store";
import { applyCourseBuilderDeletionEffects } from "@/features/notebook/course-builder/hooks/invalidate-course-scene-state";

const COURSE = { id: "course-a", title: "Cyber Safety" };
const LESSONS = [
  { id: "lesson-1", title: "One" },
  { id: "lesson-2", title: "Two" },
  { id: "lesson-3", title: "Three" },
  { id: "lesson-4", title: "Four" },
];
const SCENES = [
  { id: "scene-1", title: "Intro" },
  { id: "scene-2", title: "Spot it" },
  { id: "scene-3", title: "Practise" },
];

const store = () => useCourseBuilderStore.getState();

function createUtils(seed?: {
  lessons?: { id: string; title: string }[];
  scenes?: { id: string; title: string }[];
}) {
  const lessons = seed?.lessons ?? LESSONS;
  const scenes = seed?.scenes ?? SCENES;
  return {
    course: {
      getById: {
        fetch: vi.fn(async (_input: { courseId: string }) => null),
      },
      getLesson: {
        fetch: vi.fn(
          async (_input: { courseId: string; lessonId: string }) => ({
            id: "",
            title: "",
          }),
        ),
      },
      listLessons: {
        invalidate: vi.fn(async (_input: { courseId: string }) => {}),
        getData: vi.fn((_input: { courseId: string; limit: number }) =>
          lessons.length ? { items: lessons } : undefined,
        ),
      },
      getOutdatedScenes: {
        invalidate: vi.fn(async (_input: { courseId: string }) => {}),
      },
    },
    scene: {
      getLessonScenes: {
        invalidate: vi.fn(async (_input?: { lessonId: string }) => {}),
        cancel: vi.fn(async (_input: { lessonId: string }) => {}),
        getData: vi.fn((_input: { lessonId: string }) =>
          scenes.length ? scenes : undefined,
        ),
      },
    },
  };
}

function authorIsOn(lessonIndex: number, sceneIndex?: number) {
  store().openCourse({ course: COURSE });
  store().setActiveLesson(LESSONS[lessonIndex]);
  if (sceneIndex !== undefined) store().setActiveScene(SCENES[sceneIndex]);
}

beforeEach(() => {
  useCourseBuilderStore.setState(INITIAL_STATE);
});

describe("a lesson deleted under the author", () => {
  it("JX1: they land on the lesson that follows the one they lost", () => {
    const utils = createUtils();
    authorIsOn(1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeLesson).toEqual(LESSONS[2]);
  });

  it("JX1: losing the last lesson moves them back rather than nowhere", () => {
    const utils = createUtils();
    authorIsOn(3);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[3]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeLesson).toEqual(LESSONS[2]);
  });

  it("JX1: a run of deletions skips past all of them", () => {
    const utils = createUtils();
    authorIsOn(1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id, LESSONS[2]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeLesson).toEqual(LESSONS[3]);
  });

  it("JX1: an emptied course clears the selection", () => {
    const utils = createUtils();
    authorIsOn(0);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: LESSONS.map((lesson) => lesson.id),
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeLesson).toBeUndefined();
  });

  it("JX1: with no lesson list to consult, the selection is cleared rather than guessed", () => {
    const utils = createUtils({ lessons: [] });
    authorIsOn(1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeLesson).toBeUndefined();
  });

  it("JX4: the scene they were reading goes with its lesson", () => {
    const utils = createUtils();
    authorIsOn(1, 1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeScene).toBeUndefined();
  });

  it("JX5: a lesson they were not on moves nothing", () => {
    const utils = createUtils();
    authorIsOn(1, 1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[3]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().activeLesson).toEqual(LESSONS[1]);
    expect(store().activeScene).toEqual(SCENES[1]);
  });

  it("JA9: being moved by a deletion does not change who is driving", () => {
    const utils = createUtils();
    store().agentTouched({ course: COURSE, lesson: LESSONS[1] });

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(store().isFollowingAgent).toBe(true);
  });
});

describe("a scene deleted under the author", () => {
  it("JX2: they land on the scene that follows the one they lost", () => {
    const utils = createUtils();
    authorIsOn(1, 1);

    applyCourseBuilderDeletionEffects({
      kind: "scene",
      deletedIds: [SCENES[1]!.id],
      courseId: COURSE.id,
      lessonIds: [LESSONS[1]!.id],
      utils,
    });

    expect(store().activeScene).toEqual(SCENES[2]);
    expect(store().activeLesson).toEqual(LESSONS[1]);
  });

  it("JX2: losing the last scene moves them back", () => {
    const utils = createUtils();
    authorIsOn(1, 2);

    applyCourseBuilderDeletionEffects({
      kind: "scene",
      deletedIds: [SCENES[2]!.id],
      courseId: COURSE.id,
      lessonIds: [LESSONS[1]!.id],
      utils,
    });

    expect(store().activeScene).toEqual(SCENES[1]);
  });

  it("JX5: a scene they were not on moves nothing", () => {
    const utils = createUtils();
    authorIsOn(1, 0);

    applyCourseBuilderDeletionEffects({
      kind: "scene",
      deletedIds: [SCENES[2]!.id],
      courseId: COURSE.id,
      lessonIds: [LESSONS[1]!.id],
      utils,
    });

    expect(store().activeScene).toEqual(SCENES[0]);
  });
});

describe("saying what happened", () => {
  it("JX3: the author is told what was deleted and where they have been put", () => {
    const utils = createUtils();
    const notify = vi.fn();
    authorIsOn(1, 1);

    applyCourseBuilderDeletionEffects({
      kind: "scene",
      deletedIds: [SCENES[1]!.id],
      courseId: COURSE.id,
      lessonIds: [LESSONS[1]!.id],
      utils,
      notify,
    });

    expect(notify).toHaveBeenCalledWith({
      kind: "scene",
      deleted: SCENES[1],
      movedTo: SCENES[2],
    });
  });

  it("JX3: with nothing left to move to, they are told that too", () => {
    const utils = createUtils({ lessons: [] });
    const notify = vi.fn();
    authorIsOn(1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id],
      courseId: COURSE.id,
      utils,
      notify,
    });

    expect(notify).toHaveBeenCalledWith({
      kind: "lesson",
      deleted: LESSONS[1],
      movedTo: undefined,
    });
  });

  it("JX5: nothing is said when the author was not standing on it", () => {
    const utils = createUtils();
    const notify = vi.fn();
    authorIsOn(1, 1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[3]!.id],
      courseId: COURSE.id,
      utils,
      notify,
    });

    expect(notify).not.toHaveBeenCalled();
  });
});

describe("the caches behind it", () => {
  it("JX6: in-flight reads of a deleted lesson are cancelled before anything is refetched", () => {
    const utils = createUtils();
    const order: string[] = [];
    utils.scene.getLessonScenes.cancel.mockImplementation(async () => {
      order.push("cancel");
    });
    utils.scene.getLessonScenes.invalidate.mockImplementation(async () => {
      order.push("invalidate");
    });
    utils.course.listLessons.invalidate.mockImplementation(async () => {
      order.push("invalidate");
    });
    authorIsOn(1);

    applyCourseBuilderDeletionEffects({
      kind: "lesson",
      deletedIds: [LESSONS[1]!.id],
      courseId: COURSE.id,
      utils,
    });

    expect(order[0]).toBe("cancel");
  });

  it("JC2: the deletion's own course is the one refreshed", () => {
    const utils = createUtils();
    authorIsOn(1, 1);

    applyCourseBuilderDeletionEffects({
      kind: "scene",
      deletedIds: [SCENES[1]!.id],
      courseId: "course-elsewhere",
      lessonIds: [LESSONS[1]!.id],
      utils,
    });

    expect(utils.course.getOutdatedScenes.invalidate).toHaveBeenCalledWith({
      courseId: "course-elsewhere",
    });
  });
});
