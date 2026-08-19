import type { CourseMode } from "@scibly/db/enums";
import type { PlayerLesson, PlayerViewState } from "../../utils/player-types";
import type { NavigationSessionState } from "./navigation-session";
import type { DbProgress, NormalizedCourse, RawMemberCourse } from "./types";

import { LessonIcon, SceneAnimation } from "@scibly/db/enums";
import { describe, expect, it } from "vitest";

import {
  deriveAchievedScorePct,
  deriveCourseState,
  deriveLessonAttemptSp,
  derivePendingSubmissions,
  derivePlayerProgress,
  resolvePlayerViewState,
} from "./calculations";
import {
  EMPTY_PROGRESS_DELTA,
  initialNavigationSessionState,
  navigationSessionReducer,
} from "./navigation-session";

const OVERVIEW: PlayerViewState = { type: "overview" };

function dbProgress(overrides: Partial<DbProgress> = {}): DbProgress {
  return {
    completedLessonIds: [],
    completedSceneIds: [],
    totalSP: 0,
    sceneAnalytics: [],
    hasPassed: false,
    triesCount: 0,
    status: "NOT_STARTED",
    ...overrides,
  };
}

function memberCourse(
  overrides: Partial<RawMemberCourse> = {},
): RawMemberCourse {
  return {
    id: "c1",
    title: "Course",
    mode: "COURSE",
    thumbnail: null,
    passingScorePct: 80,
    maxTries: 3,
    lessons: [],
    maxSp: 0,
    enrollmentId: "e1",
    status: "IN_PROGRESS",
    courseVersionId: "cv1",
    version: 1,
    triesCount: 0,
    hasCertificate: false,
    ...overrides,
  };
}

function lesson(...sceneIds: string[]): PlayerLesson {
  return {
    id: "l1",
    title: "Lesson",
    description: null,
    icon: LessonIcon.BOOK,
    estimatedTimeToCompleteMinutes: 5,
    maxSp: 0,
    scenes: sceneIds.map((id) => ({
      id,
      animation: SceneAnimation.FADE,
      design: null,
      kind: "assessment" as const,
    })),
  };
}

function reduce(
  events: Parameters<typeof navigationSessionReducer>[1][],
  from: NavigationSessionState = initialNavigationSessionState,
): NavigationSessionState {
  return events.reduce(navigationSessionReducer, from);
}

const completedLessonIds = (state: NavigationSessionState) =>
  state.localProgressDelta.completedLessonIds;

describe("navigation session", () => {
  describe("the optimistic overlay", () => {
    it("NS1: a lesson completed this session counts before the server confirms it", () => {
      const state = reduce([
        { type: "LESSON_SELECTED", lessonId: "l1" },
        {
          type: "LESSON_COMPLETED",
          lessonId: "l1",
          spEarned: 30,
          wasAlreadyCompleted: false,
        },
      ]);

      expect(completedLessonIds(state)).toEqual(["l1"]);
    });

    it("NS1: a lesson the learner is only revisiting does not count a second time", () => {
      const state = reduce([
        {
          type: "LESSON_COMPLETED",
          lessonId: "l1",
          spEarned: 30,
          wasAlreadyCompleted: false,
        },
        {
          type: "LESSON_COMPLETED",
          lessonId: "l1",
          spEarned: 0,
          wasAlreadyCompleted: true,
        },
      ]);

      expect(completedLessonIds(state)).toEqual(["l1"]);
    });

    it("NS2: authoritative progress replaces the overlay rather than merging with it", () => {
      const progress = derivePlayerProgress(
        dbProgress({ completedLessonIds: ["l2"] }),
        { completedLessonIds: ["l1"] },
      );

      expect(progress.completedLessonIds).toEqual(["l2"]);
    });

    it("NS2: with no server progress yet the learner still sees their own session", () => {
      const progress = derivePlayerProgress(null, {
        completedLessonIds: ["l1"],
      });

      expect(progress.completedLessonIds).toEqual(["l1"]);
    });

    it("NS4: a restart clears the overlay so the replayed course starts empty", () => {
      const state = reduce([
        {
          type: "LESSON_COMPLETED",
          lessonId: "l1",
          spEarned: 30,
          wasAlreadyCompleted: false,
        },
        { type: "RESTART_BEGIN" },
      ]);

      expect(completedLessonIds(state)).toEqual([]);
      expect(state.localProgressDelta).toEqual(EMPTY_PROGRESS_DELTA);
    });
  });

  describe("the score the learner is shown", () => {
    it.each([
      {
        name: "NS5: the running score is earned SP over the course total, rounded to a whole percent",
        viewState: OVERVIEW,
        totalSP: 1,
        courseMaxSP: 3,
        expected: 33,
      },
      {
        name: "NS5: a half percent rounds up, matching the server (AT14)",
        viewState: OVERVIEW,
        totalSP: 1,
        courseMaxSP: 8,
        expected: 13,
      },
      {
        name: "NS6: a course with nothing gradable shows 100%, not 0%",
        viewState: OVERVIEW,
        totalSP: 0,
        courseMaxSP: 0,
        expected: 100,
      },
      {
        name: "NS5: a finished course shows the score the server recorded, not one recomputed locally",
        viewState: { type: "course_complete", finalScorePct: 82 },
        totalSP: 10,
        courseMaxSP: 100,
        expected: 82,
      },
    ] as const)("$name", ({ viewState, totalSP, courseMaxSP, expected }) => {
      expect(deriveAchievedScorePct(viewState, totalSP, courseMaxSP)).toBe(
        expected,
      );
    });
  });

  describe("what the learner may do with the course", () => {
    const course = (maxTries: number | null) => maxTries;

    it.each([
      {
        name: "NS8: a learner who has not started is neither passed nor locked",
        stored: {
          status: "NOT_STARTED" as const,
          hasPassed: false,
          triesCount: 0,
        },
        maxTries: course(3),
        expectedPassed: false,
        expectedLocked: false,
      },
      {
        name: "NS8: a learner mid-course is neither passed nor locked",
        stored: {
          status: "IN_PROGRESS" as const,
          hasPassed: false,
          triesCount: 1,
        },
        maxTries: course(3),
        expectedPassed: false,
        expectedLocked: false,
      },
      {
        name: "NS8: a learner who finished above the threshold has passed",
        stored: {
          status: "COMPLETED" as const,
          hasPassed: true,
          triesCount: 1,
        },
        maxTries: course(3),
        expectedPassed: true,
        expectedLocked: false,
      },
      {
        name: "NS8: a learner who failed with tries left is offered another",
        stored: {
          status: "COMPLETED" as const,
          hasPassed: false,
          triesCount: 1,
        },
        maxTries: course(3),
        expectedPassed: false,
        expectedLocked: false,
      },
      {
        name: "NS8: a learner who failed with no tries left is locked out",
        stored: {
          status: "COMPLETED" as const,
          hasPassed: false,
          triesCount: 3,
        },
        maxTries: course(3),
        expectedPassed: false,
        expectedLocked: true,
      },
      {
        name: "NS8: a course granting no tries at all locks every learner, exactly as the server holds it (AT17)",
        stored: {
          status: "NOT_STARTED" as const,
          hasPassed: false,
          triesCount: 0,
        },
        maxTries: course(0),
        expectedPassed: false,
        expectedLocked: true,
      },
      {
        name: "NS8: an uncapped course never locks, however many tries are spent",
        stored: {
          status: "COMPLETED" as const,
          hasPassed: false,
          triesCount: 99,
        },
        maxTries: course(null),
        expectedPassed: false,
        expectedLocked: false,
      },
      {
        name: "NS8: a passed learner is never locked, even past the cap",
        stored: {
          status: "COMPLETED" as const,
          hasPassed: true,
          triesCount: 5,
        },
        maxTries: course(3),
        expectedPassed: true,
        expectedLocked: false,
      },
    ])("$name", ({ stored, maxTries, expectedPassed, expectedLocked }) => {
      const state = deriveCourseState(
        false,
        dbProgress(stored),
        null,
        maxTries,
      );

      expect(state.hasPassed).toBe(expectedPassed);
      expect(state.isLocked).toBe(expectedLocked);
    });

    it("NS5a: a running score above the threshold does not make a mid-course learner passed", () => {
      const state = deriveCourseState(
        false,
        dbProgress({ status: "IN_PROGRESS", hasPassed: false, totalSP: 90 }),
        memberCourse({ passingScorePct: 80 }),
        3,
      );

      expect(deriveAchievedScorePct(OVERVIEW, 90, 100)).toBe(90);
      expect(state.hasPassed).toBe(false);
    });

    it("NS8: pass state comes from the recorded progress, never from a certificate row (SC17a)", () => {
      const state = deriveCourseState(
        false,
        dbProgress({ status: "COMPLETED", hasPassed: true, triesCount: 1 }),
        memberCourse({ hasCertificate: false }),
        3,
      );

      expect(state.hasPassed).toBe(true);
    });

    it("NS8: a certificate row alone does not make a learner passed", () => {
      const state = deriveCourseState(
        false,
        dbProgress({ status: "COMPLETED", hasPassed: false, triesCount: 1 }),
        memberCourse({ hasCertificate: true }),
        3,
      );

      expect(state.hasPassed).toBe(false);
    });

    it("NS8: an anonymous learner never holds a certificate", () => {
      const state = deriveCourseState(
        true,
        dbProgress({ status: "COMPLETED", hasPassed: true, triesCount: 1 }),
        memberCourse({ hasCertificate: true }),
        3,
      );

      expect(state.hasCertificate).toBe(false);
      expect(state.hasPassed).toBe(true);
    });
  });

  describe("returning to a scene already answered", () => {
    const ANALYTICS = [
      {
        sceneId: "sc1",
        spEarned: 10,
        gradedBlocks: [
          {
            blockId: "b1",
            blockType: "multiple-choice",
            learnerAnswer: "a",
            achievedPoints: 1,
            maxPoints: 1,
            spEarned: 10,
          },
        ],
      },
    ];

    it("NS7: a completed scene restores the learner's answers and their feedback", () => {
      const submissions = derivePendingSubmissions(
        dbProgress({ sceneAnalytics: ANALYTICS, completedSceneIds: ["sc1"] }),
      );

      expect(submissions.sc1?.blocks).toEqual([
        { blockId: "b1", blockType: "multiple-choice", learnerAnswer: "a" },
      ]);
      expect(submissions.sc1?.gradedBlocks).toHaveLength(1);
    });

    it("NS7: a scene not yet completed restores the answers without the feedback", () => {
      const submissions = derivePendingSubmissions(
        dbProgress({ sceneAnalytics: ANALYTICS, completedSceneIds: [] }),
      );

      expect(submissions.sc1?.blocks).toHaveLength(1);
      expect(submissions.sc1?.gradedBlocks).toBeUndefined();
    });

    it("NS7: a learner with no recorded progress restores nothing rather than failing", () => {
      expect(derivePendingSubmissions(null)).toEqual({});
    });
  });

  describe("the SP a lesson has already earned", () => {
    it("NS9: a scene revisited within the attempt is counted once, at its best", () => {
      const sp = deriveLessonAttemptSp(
        lesson("sc1", "sc2"),
        dbProgress({
          sceneAnalytics: [
            { sceneId: "sc1", spEarned: 10, gradedBlocks: [] },
            { sceneId: "sc1", spEarned: 4, gradedBlocks: [] },
            { sceneId: "sc2", spEarned: 5, gradedBlocks: [] },
          ],
        }),
      );

      expect(sp).toBe(15);
    });

    it("NS9: SP earned in another lesson does not count toward this one", () => {
      const sp = deriveLessonAttemptSp(
        lesson("sc1"),
        dbProgress({
          sceneAnalytics: [
            { sceneId: "sc1", spEarned: 10, gradedBlocks: [] },
            { sceneId: "other-lesson-scene", spEarned: 40, gradedBlocks: [] },
          ],
        }),
      );

      expect(sp).toBe(10);
    });

    it("NS9: a lesson with no recorded analytics has earned nothing", () => {
      expect(deriveLessonAttemptSp(lesson("sc1"), null)).toBe(0);
    });
  });

  describe("where a lesson-mode course opens", () => {
    const course = (mode: CourseMode, ...lessons: PlayerLesson[]) =>
      ({ mode, lessons }) as unknown as NormalizedCourse;
    const UNFINISHED: string[] = [];

    it("sends the learner into the one lesson instead of an overview it has no page for", () => {
      expect(
        resolvePlayerViewState(
          course("LESSON", lesson("sc1")),
          OVERVIEW,
          UNFINISHED,
        ),
      ).toEqual({ type: "lesson", lessonId: "l1" });
    });

    it("leaves a course-mode course on its overview", () => {
      expect(
        resolvePlayerViewState(
          course("COURSE", lesson("sc1")),
          OVERVIEW,
          UNFINISHED,
        ),
      ).toEqual(OVERVIEW);
    });

    it("leaves every other view state alone, including the completion screen", () => {
      const complete: PlayerViewState = {
        type: "complete",
        lessonId: "l1",
        spEarned: 10,
      };

      expect(
        resolvePlayerViewState(
          course("LESSON", lesson("sc1")),
          complete,
          UNFINISHED,
        ),
      ).toBe(complete);
    });

    it("stays on the overview while a lesson-mode course is still empty", () => {
      expect(
        resolvePlayerViewState(course("LESSON"), OVERVIEW, UNFINISHED),
      ).toBe(OVERVIEW);
    });

    it("stops sending the learner in once the one lesson is finished", () => {
      expect(
        resolvePlayerViewState(course("LESSON", lesson("sc1")), OVERVIEW, [
          "l1",
        ]),
      ).toBe(OVERVIEW);
    });
  });
});
