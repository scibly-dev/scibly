import { beforeEach, describe, expect, it } from "vitest";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "@/features/notebook/course-builder/course-builder-store";

// The store itself is exercised directly, with no mocking: it's our state
// machine, not an external boundary.

const COURSE_A = { id: "course-a", title: "Cyber Safety" };
const COURSE_B = { id: "course-b", title: "Onboarding" };
const LESSON_A1 = { id: "lesson-a1", title: "Spotting phishing" };
const LESSON_A2 = { id: "lesson-a2", title: "Password hygiene" };
const LESSON_B1 = { id: "lesson-b1", title: "Your first week" };
const SCENE_A1 = { id: "scene-a1", title: "Introduction" };
const SCENE_A2 = { id: "scene-a2", title: "Spot the sender" };

const store = () => useCourseBuilderStore.getState();

function authorIsOn(
  course: { id: string; title: string },
  lesson?: { id: string; title: string },
  scene?: { id: string; title: string },
) {
  store().openCourse({ course });
  if (lesson) store().setActiveLesson(lesson);
  if (scene) store().setActiveScene(scene);
}

function agentIsOn(
  course: { id: string; title: string },
  lesson?: { id: string; title: string },
  scene?: { id: string; title: string },
) {
  store().agentTouched({ course, lesson, scene });
}

beforeEach(() => {
  useCourseBuilderStore.setState(INITIAL_STATE);
});

describe("who is driving", () => {
  it("JA1: a conversation starts out following the agent", () => {
    expect(store().isFollowingAgent).toBe(true);
    expect(store().agentTarget).toBeUndefined();
  });

  it.each([
    {
      interaction: "opening a course",
      act: () => store().openCourse({ course: COURSE_A }),
    },
    {
      interaction: "opening a lesson",
      act: () => store().setActiveLesson(LESSON_A1),
    },
    {
      interaction: "opening a scene",
      act: () => store().setActiveScene(SCENE_A1),
    },
    {
      interaction: "editing without moving the selection",
      act: () => store().takeOverFromAgent(),
    },
  ])("JA2: $interaction hands the author the wheel", ({ act }) => {
    act();

    expect(store().isFollowingAgent).toBe(false);
  });

  it("JA3: detaching lasts the conversation — later agent work does not win it back", () => {
    authorIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    agentIsOn(COURSE_B, LESSON_B1);
    agentIsOn(COURSE_B, LESSON_B1, SCENE_A2);

    expect(store().isFollowingAgent).toBe(false);
    expect(store().course).toEqual(COURSE_A);
  });

  it("JA4: only the follow control re-attaches", () => {
    authorIsOn(COURSE_A);
    agentIsOn(COURSE_B, LESSON_B1);

    store().followAgent();

    expect(store().isFollowingAgent).toBe(true);
  });

  it("JA5: following again lands on what the agent is working on right now", () => {
    authorIsOn(COURSE_A, LESSON_A1, SCENE_A1);
    agentIsOn(COURSE_B, LESSON_B1);

    store().followAgent();

    expect(store().course).toEqual(COURSE_B);
    expect(store().activeLesson).toEqual(LESSON_B1);

    expect(store().activeScene).toBeUndefined();
  });

  it("JA5: following with nothing to follow yet changes only who is driving", () => {
    authorIsOn(COURSE_A, LESSON_A1);

    store().followAgent();

    expect(store().isFollowingAgent).toBe(true);
    expect(store().course).toEqual(COURSE_A);
    expect(store().activeLesson).toEqual(LESSON_A1);
  });

  it("JA6: a new chat follows again and forgets what the last agent was doing", () => {
    authorIsOn(COURSE_A, LESSON_A1, SCENE_A1);
    agentIsOn(COURSE_B, LESSON_B1);
    store().markStudioOpenedItself();

    store().reset();

    expect(store()).toMatchObject(INITIAL_STATE);
  });

  it.each([
    {
      move: "a course",
      act: () =>
        store().openCourse({ course: COURSE_A, origin: "system" as const }),
    },
    {
      move: "a lesson",
      act: () => store().setActiveLesson(LESSON_A1, "system"),
    },
    { move: "a scene", act: () => store().setActiveScene(SCENE_A1, "system") },
  ])(
    "JA9: the builder moving to $move by itself is not an author interaction",
    ({ act }) => {
      act();

      expect(store().isFollowingAgent).toBe(true);
    },
  );

  it("JA9: repair does not hand the wheel back either", () => {
    authorIsOn(COURSE_A, LESSON_A1);

    store().setActiveLesson(LESSON_A2, "system");

    expect(store().isFollowingAgent).toBe(false);
  });
});

describe("what following moves", () => {
  it("JF1: the course the agent creates becomes the open course", () => {
    agentIsOn(COURSE_A);

    expect(store().course).toEqual(COURSE_A);
  });

  it("JF2: work on another course takes the panel there and drops the old lesson and scene", () => {
    agentIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    agentIsOn(COURSE_B, LESSON_B1);

    expect(store().course).toEqual(COURSE_B);
    expect(store().activeLesson).toEqual(LESSON_B1);
    expect(store().activeScene).toBeUndefined();
  });

  it("JF3: the lesson the agent writes becomes the active lesson", () => {
    agentIsOn(COURSE_A);

    store().agentTouched({ course: COURSE_A, lesson: LESSON_A1 });

    expect(store().activeLesson).toEqual(LESSON_A1);
  });

  it("JF3: moving to another lesson drops the scene from the one before it", () => {
    agentIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    store().agentTouched({ course: COURSE_A, lesson: LESSON_A2 });

    expect(store().activeLesson).toEqual(LESSON_A2);
    expect(store().activeScene).toBeUndefined();
  });

  it("JF4: the scene the agent writes becomes the active scene", () => {
    agentIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    store().agentTouched({
      course: COURSE_A,
      lesson: LESSON_A1,
      scene: SCENE_A2,
    });

    expect(store().activeScene).toEqual(SCENE_A2);
  });

  it("JF5: a content write moves the panel onto the scene even though nothing was created", () => {
    agentIsOn(COURSE_A, LESSON_A1, SCENE_A1);
    store().agentTouched({
      course: COURSE_A,
      lesson: LESSON_A2,
      scene: SCENE_A2,
    });

    store().agentTouched({ scene: SCENE_A1 });

    expect(store().activeScene).toEqual(SCENE_A1);
    expect(store().activeLesson).toEqual(LESSON_A2);
    expect(store().course).toEqual(COURSE_A);
  });

  it("JF6: work that names only the open course leaves the lesson and scene alone", () => {
    agentIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    store().agentTouched({ course: COURSE_A });

    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toEqual(SCENE_A1);
  });
});

describe("while the author is driving", () => {
  it("JD1: no amount of agent work moves the panel", () => {
    authorIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    agentIsOn(COURSE_B, LESSON_B1, SCENE_A2);

    expect(store().course).toEqual(COURSE_A);
    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toEqual(SCENE_A1);
  });

  it("JD1: agent work on the very course the author is reading still moves nothing", () => {
    authorIsOn(COURSE_A, LESSON_A1, SCENE_A1);

    store().agentTouched({
      course: COURSE_A,
      lesson: LESSON_A2,
      scene: SCENE_A2,
    });

    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toEqual(SCENE_A1);
  });

  it("JD4: the builder can name what the agent is working on", () => {
    authorIsOn(COURSE_A, LESSON_A1);

    agentIsOn(COURSE_B, LESSON_B1, SCENE_A2);

    expect(store().agentTarget).toEqual({
      course: COURSE_B,
      lesson: LESSON_B1,
      scene: SCENE_A2,
    });
  });

  it("JD4: the target keeps up as the agent moves between lessons", () => {
    authorIsOn(COURSE_A);
    agentIsOn(COURSE_B, LESSON_B1, SCENE_A2);

    store().agentTouched({ course: COURSE_B, lesson: LESSON_A2 });

    expect(store().agentTarget).toEqual({
      course: COURSE_B,
      lesson: LESSON_A2,
      scene: undefined,
    });
  });
});

describe("the studio", () => {
  it("JS1: the studio has not opened itself when a conversation starts", () => {
    expect(store().hasStudioOpenedItself).toBe(false);
  });

  it("JS2: once it has opened itself, it is on the record for the conversation", () => {
    store().markStudioOpenedItself();
    store().markStudioOpenedItself();

    expect(store().hasStudioOpenedItself).toBe(true);
  });
});
