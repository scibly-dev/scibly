import type { PlayerCourse, PlayerLesson } from "../utils/player-types";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePlayerViewState } from "./use-player-view-state";

const lessons = [
  {
    id: "lesson-1",
    scenes: [{ id: "scene-1" }, { id: "scene-2" }],
  },
] as unknown as PlayerLesson[];

const course = {
  id: "course-1",
  mode: "COURSE",
  lessons,
} as unknown as PlayerCourse;

const sessionAfterFirstScene = {
  sceneIndex: 1,
  sessionSP: 10,
  completedSceneIds: ["scene-1"],
  pendingSubmissions: {
    "scene-1": { sceneId: "scene-1", blocks: undefined },
  },
};

describe("preview lesson session retention", () => {
  it("restores scene index, SP and answers after leaving and re-entering a lesson", () => {
    const { result } = renderHook(() => usePlayerViewState({ course }));

    act(() => result.current.handleSelectLesson("lesson-1"));
    act(() => result.current.handleLessonSessionChange(sessionAfterFirstScene));
    act(() => result.current.handleExitLesson());

    expect(result.current.viewState).toEqual({ type: "overview" });

    expect(result.current.progress.completedSceneIds).toEqual(["scene-1"]);

    act(() => result.current.handleSelectLesson("lesson-1"));

    expect(result.current.getInitialSceneIndex(lessons[0]!)).toBe(1);
    expect(result.current.initialLessonSP).toBe(10);
    expect(result.current.initialPendingSubmissions).toEqual(
      sessionAfterFirstScene.pendingSubmissions,
    );
  });

  it("keeps the resume point where it was when a finished scene is replayed", () => {
    const { result } = renderHook(() => usePlayerViewState({ course }));

    act(() => result.current.handleSelectLesson("lesson-1"));
    act(() => result.current.handleLessonSessionChange(sessionAfterFirstScene));
    act(() => result.current.handleExitLesson());

    act(() => result.current.handleSelectLesson("lesson-1", 0));
    act(() =>
      result.current.handleLessonSessionChange({
        ...sessionAfterFirstScene,
        sceneIndex: 0,
      }),
    );

    expect(result.current.viewState).toEqual({
      type: "lesson",
      lessonId: "lesson-1",
      sceneIndex: 0,
    });

    expect(result.current.getInitialSceneIndex(lessons[0]!)).toBe(1);
  });

  it("keeps sessions separate per lesson", () => {
    const { result } = renderHook(() => usePlayerViewState({ course }));

    act(() => result.current.handleSelectLesson("lesson-1"));
    act(() => result.current.handleLessonSessionChange(sessionAfterFirstScene));
    act(() => result.current.handleSelectLesson("lesson-2"));

    expect(result.current.initialLessonSP).toBe(0);
    expect(result.current.initialPendingSubmissions).toBeUndefined();
  });
});

describe("lesson-mode course", () => {
  const lessonModeCourse = {
    ...course,
    mode: "LESSON",
  } as unknown as PlayerCourse;

  it("runs the one lesson through to the course completion screen", () => {
    const { result } = renderHook(() =>
      usePlayerViewState({ course: lessonModeCourse }),
    );

    expect(result.current.viewState).toEqual({
      type: "lesson",
      lessonId: "lesson-1",
    });

    act(() => result.current.handleLessonComplete(10));
    expect(result.current.viewState).toEqual({
      type: "complete",
      lessonId: "lesson-1",
      spEarned: 10,
    });

    act(() => result.current.handleContinueFromComplete());
    expect(result.current.viewState).toEqual({ type: "course_complete" });
  });
});
