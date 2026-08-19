import { describe, expect, it } from "vitest";

import { lessonCreatedDelta } from "./lesson-tools";

const LESSON = { id: "lesson-1", title: "Spotting phishing" };

function scene(id: string, title: string, order: number) {
  return { id, title, order, lessonId: LESSON.id };
}

describe("the delta a freshly created lesson announces", () => {
  it("JF8: names the Introduction scene the lesson was born with", () => {
    expect(
      lessonCreatedDelta({
        courseId: "course-1",
        lesson: LESSON,
        scenes: [scene("scene-1", "Introduction", 0)],
      }),
    ).toEqual({
      type: "lesson-created",
      courseId: "course-1",
      lesson: LESSON,
      scene: { id: "scene-1", title: "Introduction" },
    });
  });

  it("JF8: names the scene the lesson opens on, not whichever came back last", () => {
    const delta = lessonCreatedDelta({
      courseId: "course-1",
      lesson: LESSON,
      scenes: [
        scene("scene-1", "Introduction", 0),
        scene("scene-2", "The three tells", 1),
      ],
    });

    expect(delta).toMatchObject({ scene: { id: "scene-1" } });
  });

  it("JF8: a lesson that came back with no scenes names none", () => {
    const delta = lessonCreatedDelta({
      courseId: "course-1",
      lesson: LESSON,
      scenes: [],
    });

    expect(delta).toEqual({
      type: "lesson-created",
      courseId: "course-1",
      lesson: LESSON,
    });
  });
});
