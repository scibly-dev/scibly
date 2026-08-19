"use client";

import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export interface CourseEntity {
  id: string;
  title: string;
}

export interface AgentTarget {
  course: CourseEntity | undefined;
  lesson: CourseEntity | undefined;
  scene: CourseEntity | undefined;
}

interface CourseBuilderState {
  course: CourseEntity | undefined;
  activeLesson: CourseEntity | undefined;
  activeScene: CourseEntity | undefined;

  isFollowingAgent: boolean;

  agentTarget: AgentTarget | undefined;

  hasStudioOpenedItself: boolean;
}

type SelectionOrigin = "author" | "system";

interface CourseBuilderActions {
  openCourse: (params: {
    course: CourseEntity;
    origin?: SelectionOrigin;
  }) => void;

  setActiveLesson: (
    lesson: CourseEntity | undefined,
    origin?: SelectionOrigin,
  ) => void;

  setActiveScene: (
    scene: CourseEntity | undefined,
    origin?: SelectionOrigin,
  ) => void;

  takeOverFromAgent: () => void;

  agentTouched: (target: Partial<AgentTarget>) => void;

  followAgent: () => void;

  markStudioOpenedItself: () => void;

  reset: () => void;
}

export const INITIAL_STATE: CourseBuilderState = {
  course: undefined,
  activeLesson: undefined,
  activeScene: undefined,

  isFollowingAgent: true,
  agentTarget: undefined,
  hasStudioOpenedItself: false,
};

export type CourseBuilderStore = CourseBuilderState & CourseBuilderActions;

function mergeAgentTarget(
  previous: AgentTarget | undefined,
  next: Partial<AgentTarget>,
): AgentTarget {
  const course = next.course ?? previous?.course;
  const courseChanged = course?.id !== previous?.course?.id;

  const lesson = next.lesson ?? (courseChanged ? undefined : previous?.lesson);
  const lessonChanged = lesson?.id !== previous?.lesson?.id;

  const scene =
    next.scene ??
    (courseChanged || lessonChanged ? undefined : previous?.scene);

  return { course, lesson, scene };
}

export const useCourseBuilderStore = createWithEqualityFn<CourseBuilderStore>()(
  (set) => ({
    ...INITIAL_STATE,

    openCourse: ({ course, origin = "author" }) => {
      set((state) => ({
        course,
        activeLesson: undefined,
        activeScene: undefined,
        isFollowingAgent: origin === "author" ? false : state.isFollowingAgent,
      }));
    },

    setActiveLesson: (lesson, origin = "author") =>
      set((state) => ({
        activeLesson: lesson,
        activeScene: undefined,
        isFollowingAgent: origin === "author" ? false : state.isFollowingAgent,
      })),

    setActiveScene: (scene, origin = "author") =>
      set((state) => ({
        activeScene: scene,
        isFollowingAgent: origin === "author" ? false : state.isFollowingAgent,
      })),

    takeOverFromAgent: () => set({ isFollowingAgent: false }),

    agentTouched: (target) =>
      set((state) => {
        const agentTarget = mergeAgentTarget(state.agentTarget, target);
        if (!state.isFollowingAgent) return { agentTarget };

        const courseChanged =
          agentTarget.course !== undefined &&
          agentTarget.course.id !== state.course?.id;

        const activeLesson = courseChanged
          ? agentTarget.lesson
          : (target.lesson ?? state.activeLesson);
        const lessonChanged = activeLesson?.id !== state.activeLesson?.id;

        return {
          agentTarget,
          course: agentTarget.course ?? state.course,
          activeLesson,
          activeScene:
            courseChanged || lessonChanged
              ? target.scene
              : (target.scene ?? state.activeScene),
        };
      }),

    followAgent: () =>
      set((state) => {
        const target = state.agentTarget;
        if (!target) return { isFollowingAgent: true };
        return {
          isFollowingAgent: true,
          course: target.course ?? state.course,
          activeLesson: target.lesson,
          activeScene: target.scene,
        };
      }),

    markStudioOpenedItself: () => set({ hasStudioOpenedItself: true }),

    reset: () => set(INITIAL_STATE),
  }),
  shallow,
);
