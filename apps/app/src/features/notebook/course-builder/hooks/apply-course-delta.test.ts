import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "@/features/notebook/course-builder/course-builder-store";
import { applyCourseDelta } from "@/features/notebook/course-builder/hooks/apply-course-delta";

const COURSE_A = { id: "course-a", title: "Cyber Safety" };
const COURSE_B = { id: "course-b", title: "Onboarding" };
const LESSON_A1 = { id: "lesson-a1", title: "Spotting phishing" };
const LESSON_B1 = { id: "lesson-b1", title: "Your first week" };
const SCENE_A1 = { id: "scene-a1", title: "Introduction" };
const SCENE_B1 = { id: "scene-b1", title: "Introduction" };

const store = () => useCourseBuilderStore.getState();

function createQueryClient(seed?: {
  courses?: { id: string; title: string }[];
  lessons?: { id: string; title: string; courseId: string }[];
}) {
  const courses = seed?.courses ?? [COURSE_A, COURSE_B];
  const lessons = seed?.lessons ?? [
    { ...LESSON_A1, courseId: COURSE_A.id },
    { ...LESSON_B1, courseId: COURSE_B.id },
  ];
  return {
    course: {
      getById: {
        fetch: vi.fn(
          async ({ courseId }: { courseId: string }) =>
            courses.find((course) => course.id === courseId) ?? null,
        ),
      },
      getLesson: {
        fetch: vi.fn(
          async ({
            courseId,
            lessonId,
          }: {
            courseId: string;
            lessonId: string;
          }) => {
            const lesson = lessons.find(
              (candidate) =>
                candidate.id === lessonId && candidate.courseId === courseId,
            );
            if (!lesson) throw new Error(`No lesson ${lessonId}`);
            return lesson;
          },
        ),
      },
      listLessons: {
        invalidate: vi.fn(async (_input: { courseId: string }) => {}),
        getData: vi.fn(
          (_input: { courseId: string; limit: number }) => undefined,
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
        getData: vi.fn((_input: { lessonId: string }) => undefined),
      },
    },
  };
}

function createDeps(seed?: Parameters<typeof createQueryClient>[0]) {
  return { client: createQueryClient(seed), openStudio: vi.fn() };
}

function authorIsOnCourseA() {
  store().openCourse({ course: COURSE_A });
  store().setActiveLesson(LESSON_A1);
}

beforeEach(() => {
  useCourseBuilderStore.setState(INITIAL_STATE);
});

describe("opening the studio", () => {
  it("JS1: the first delta of a conversation opens the studio", async () => {
    const deps = createDeps();

    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);

    expect(deps.openStudio).toHaveBeenCalledTimes(1);
  });

  it("JS2: every delta after it leaves the sidebar alone", async () => {
    const deps = createDeps();

    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);
    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_A1, courseId: COURSE_A.id },
      deps,
    );
    await applyCourseDelta(
      { type: "invalidation-updated", courseId: COURSE_A.id },
      deps,
    );

    expect(deps.openStudio).toHaveBeenCalledTimes(1);
  });

  it("JS2: a delta never opens the studio over an author who is driving", async () => {
    const deps = createDeps();
    authorIsOnCourseA();

    await applyCourseDelta({ type: "course-created", course: COURSE_B }, deps);

    expect(deps.openStudio).not.toHaveBeenCalled();
  });
});

describe("keeping caches honest", () => {
  it("JD2/JC1: a lesson change refreshes the lesson list of the course it names", async () => {
    const deps = createDeps();
    authorIsOnCourseA();

    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_B1, courseId: COURSE_B.id },
      deps,
    );

    expect(deps.client.course.listLessons.invalidate).toHaveBeenCalledWith({
      courseId: COURSE_B.id,
    });
  });

  it("JD2/JC2: a scene change refreshes that lesson's scenes and its own course's outdated set", async () => {
    const deps = createDeps();
    authorIsOnCourseA();

    await applyCourseDelta(
      {
        type: "scene-created",
        scene: SCENE_B1,
        lessonId: LESSON_B1.id,
        courseId: COURSE_B.id,
      },
      deps,
    );

    expect(deps.client.scene.getLessonScenes.invalidate).toHaveBeenCalledWith({
      lessonId: LESSON_B1.id,
    });
    expect(
      deps.client.course.getOutdatedScenes.invalidate,
    ).toHaveBeenCalledWith({ courseId: COURSE_B.id });
    expect(
      deps.client.course.getOutdatedScenes.invalidate,
    ).not.toHaveBeenCalledWith({ courseId: COURSE_A.id });
  });

  it("JD3: a scene change in the course the author is reading refreshes it in place", async () => {
    const deps = createDeps();
    authorIsOnCourseA();

    await applyCourseDelta(
      {
        type: "scene-updated",
        scene: SCENE_B1,
        lessonId: LESSON_A1.id,
        courseId: COURSE_A.id,
      },
      deps,
    );

    expect(deps.client.scene.getLessonScenes.invalidate).toHaveBeenCalledWith({
      lessonId: LESSON_A1.id,
    });
    expect(store().activeLesson).toEqual(LESSON_A1);
  });

  it("JC3: an invalidation naming no lessons refreshes every scene list", async () => {
    const deps = createDeps();

    await applyCourseDelta(
      { type: "invalidation-updated", courseId: COURSE_A.id },
      deps,
    );

    expect(deps.client.scene.getLessonScenes.invalidate).toHaveBeenCalledWith();
  });

  it("JC3: an invalidation naming lessons refreshes only those", async () => {
    const deps = createDeps();

    await applyCourseDelta(
      {
        type: "invalidation-updated",
        courseId: COURSE_A.id,
        lessonIds: [LESSON_A1.id],
      },
      deps,
    );

    expect(deps.client.scene.getLessonScenes.invalidate).toHaveBeenCalledWith({
      lessonId: LESSON_A1.id,
    });
    expect(
      deps.client.scene.getLessonScenes.invalidate,
    ).not.toHaveBeenCalledWith();
  });
});

describe("following the agent", () => {
  it("JF1: the course the agent creates becomes the open course", async () => {
    const deps = createDeps();

    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);

    expect(store().course).toEqual(COURSE_A);
  });

  it("JF3: a lesson the agent writes becomes the active lesson", async () => {
    const deps = createDeps();
    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);

    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_A1, courseId: COURSE_A.id },
      deps,
    );

    expect(store().activeLesson).toEqual(LESSON_A1);

    expect(deps.client.course.getById.fetch).not.toHaveBeenCalled();
  });

  it("JF8: the Introduction scene created with the lesson is where the panel lands", async () => {
    const deps = createDeps();
    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);

    await applyCourseDelta(
      {
        type: "lesson-created",
        lesson: LESSON_A1,
        courseId: COURSE_A.id,
        scene: SCENE_A1,
      },
      deps,
    );

    expect(store().activeScene).toEqual(SCENE_A1);

    expect(store().agentTarget?.scene).toEqual(SCENE_A1);
  });

  it("JF8: a lesson that named no scene moves the lesson and nothing under it", async () => {
    const deps = createDeps();
    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);

    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_A1, courseId: COURSE_A.id },
      deps,
    );

    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toBeUndefined();
  });

  it("JF2: a lesson in a course the panel has never seen takes it there, name and all", async () => {
    const deps = createDeps();

    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_B1, courseId: COURSE_B.id },
      deps,
    );

    expect(store().course).toEqual(COURSE_B);
    expect(store().activeLesson).toEqual(LESSON_B1);
  });

  it("JF4: a scene the agent writes becomes the active scene under its own lesson", async () => {
    const deps = createDeps();

    await applyCourseDelta(
      {
        type: "scene-created",
        scene: SCENE_B1,
        lessonId: LESSON_B1.id,
        courseId: COURSE_B.id,
      },
      deps,
    );

    expect(store().course).toEqual(COURSE_B);
    expect(store().activeLesson).toEqual(LESSON_B1);
    expect(store().activeScene).toEqual(SCENE_B1);
  });

  it("JF6: a reorder refreshes the lesson and moves no selection", async () => {
    const deps = createDeps();
    await applyCourseDelta({ type: "course-created", course: COURSE_A }, deps);
    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_A1, courseId: COURSE_A.id },
      deps,
    );

    await applyCourseDelta(
      {
        type: "scenes-reordered",
        sceneIds: [SCENE_B1.id],
        lessonId: LESSON_A1.id,
        courseId: COURSE_A.id,
      },
      deps,
    );

    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toBeUndefined();
    expect(deps.client.scene.getLessonScenes.invalidate).toHaveBeenCalledWith({
      lessonId: LESSON_A1.id,
    });
  });

  it("JF1: a course that has since been deleted moves nothing", async () => {
    const deps = createDeps({ courses: [], lessons: [] });

    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_B1, courseId: COURSE_B.id },
      deps,
    );

    expect(store().course).toBeUndefined();

    expect(deps.client.course.listLessons.invalidate).toHaveBeenCalledWith({
      courseId: COURSE_B.id,
    });
  });
});

describe("while the author is driving", () => {
  it("JD1: no delta moves the panel", async () => {
    const deps = createDeps();
    authorIsOnCourseA();

    await applyCourseDelta({ type: "course-created", course: COURSE_B }, deps);
    await applyCourseDelta(
      { type: "lesson-created", lesson: LESSON_B1, courseId: COURSE_B.id },
      deps,
    );
    await applyCourseDelta(
      {
        type: "scene-created",
        scene: SCENE_B1,
        lessonId: LESSON_B1.id,
        courseId: COURSE_B.id,
      },
      deps,
    );

    expect(store().course).toEqual(COURSE_A);
    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toBeUndefined();
  });

  it("JD4: the builder can still say what the agent is working on", async () => {
    const deps = createDeps();
    authorIsOnCourseA();

    await applyCourseDelta(
      {
        type: "scene-created",
        scene: SCENE_B1,
        lessonId: LESSON_B1.id,
        courseId: COURSE_B.id,
      },
      deps,
    );

    expect(store().agentTarget).toEqual({
      course: COURSE_B,
      lesson: LESSON_B1,
      scene: SCENE_B1,
    });
  });
});
