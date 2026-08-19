import type { AttemptState, AttemptTransition } from "./progression-rules";

import { EnrollmentStatus } from "@scibly/db/enums";
import { describe, expect, it } from "vitest";

import {
  computeScorePct,
  evaluatePassState,
  getActiveAttempt,
  hasAttemptsRemaining,
  passesScore,
  transitionAttempt,
} from "./progression-rules";

const COURSE = ["s1", "s2", "s3"] as const;

const active = (...completedSceneIds: string[]): AttemptState => ({
  status: "active",
  completedSceneIds: new Set(completedSceneIds),
});

/**
 * Defaults are applied by destructuring rather than `??` because `maxTries: null`
 * is a meaningful value (uncapped) that must reach the subject, not fall through
 * to the default.
 */
const finished = ({
  completedSceneIds = [...COURSE],
  passed = false,
  triesUsed = 1,
  maxTries = 3,
}: {
  completedSceneIds?: string[];
  passed?: boolean;
  triesUsed?: number;
  maxTries?: number | null;
} = {}): AttemptState => ({
  status: "finished",
  completedSceneIds: new Set(completedSceneIds),
  passed,
  triesUsed,
  maxTries,
});

const completeScene = (sceneId: string) =>
  ({
    type: "complete-scene",
    sceneId,
    orderedSceneIds: COURSE,
  }) as const;

const REOPEN = { type: "reopen-failed-attempt" } as const;

const describeOutcome = (transition: AttemptTransition): string =>
  transition.kind === "rejected" ? transition.reason : transition.kind;

describe("attempt rules", () => {
  describe("completing a scene", () => {
    it.each([
      {
        name: "AT1: the next scene in order advances the attempt",
        state: active("s1"),
        sceneId: "s2",
        expected: "accepted",
      },
      {
        name: "AT2: a scene already completed in this attempt changes nothing",
        state: active("s1"),
        sceneId: "s1",
        expected: "idempotent",
      },
      {
        name: "AT3: a scene whose predecessor is incomplete is refused",
        state: active(),
        sceneId: "s2",
        expected: "PREVIOUS_SCENE_INCOMPLETE",
      },
      {
        name: "AT4: a scene outside the course version is refused as unknown",
        state: active("s1"),
        sceneId: "from-another-course",
        expected: "SCENE_NOT_FOUND",
      },
      {
        name: "AT5: a finished attempt refuses a scene it never completed",
        state: finished({ completedSceneIds: ["s1", "s2"] }),
        sceneId: "s3",
        expected: "ATTEMPT_FINISHED",
      },
      {
        name: "AT5: a finished attempt refuses a scene it already completed, rather than inviting the learner onward",
        state: finished(),
        sceneId: "s1",
        expected: "ATTEMPT_FINISHED",
      },
    ] as const)("$name", ({ state, sceneId, expected }) => {
      expect(
        describeOutcome(transitionAttempt(state, completeScene(sceneId))),
      ).toBe(expected);
    });

    it("AT1: an accepted completion adds the scene and keeps the earlier ones", () => {
      const transition = transitionAttempt(active("s1"), completeScene("s2"));

      expect(transition.kind).toBe("accepted");
      if (transition.kind !== "accepted") return;
      expect([...transition.state.completedSceneIds].sort()).toEqual([
        "s1",
        "s2",
      ]);
    });

    it("AT2: a re-submitted scene returns the attempt untouched", () => {
      const state = active("s1");

      const transition = transitionAttempt(state, completeScene("s1"));

      expect(transition.kind).toBe("idempotent");
      if (transition.kind !== "idempotent") return;
      expect(transition.state).toBe(state);
    });

    it("AT3: a refused completion leaves the attempt unchanged", () => {
      const state = active();

      transitionAttempt(state, completeScene("s2"));

      expect([...state.completedSceneIds]).toEqual([]);
    });
  });

  describe("starting a new attempt", () => {
    it.each([
      {
        name: "AT6: an attempt still active cannot be reopened",
        state: active("s1"),
        expected: "ATTEMPT_ACTIVE",
      },
      {
        name: "AT7: a passed attempt cannot be reopened",
        state: finished({ passed: true }),
        expected: "ATTEMPT_PASSED",
      },
      {
        name: "AT8: a failed attempt with no tries left cannot be reopened",
        state: finished({ triesUsed: 3, maxTries: 3 }),
        expected: "NO_TRIES_REMAINING",
      },
      {
        name: "AT9: a failed attempt with tries remaining is reopened",
        state: finished({ triesUsed: 1, maxTries: 3 }),
        expected: "accepted",
      },
      {
        name: "AT16: a failed attempt with no cap is always reopened",
        state: finished({ triesUsed: 99, maxTries: null }),
        expected: "accepted",
      },
    ] as const)("$name", ({ state, expected }) => {
      expect(describeOutcome(transitionAttempt(state, REOPEN))).toBe(expected);
    });

    it("AT9: the reopened attempt is empty - no scene carries over", () => {
      const transition = transitionAttempt(
        finished({ completedSceneIds: ["s1", "s2", "s3"] }),
        REOPEN,
      );

      expect(transition.kind).toBe("accepted");
      if (transition.kind !== "accepted") return;
      expect(transition.state.status).toBe("active");
      expect([...transition.state.completedSceneIds]).toEqual([]);
    });
  });

  describe("scoring", () => {
    it.each([
      {
        name: "AT13: a course with nothing gradable scores 100%",
        earned: 0,
        possible: 0,
        expected: 100,
      },
      {
        name: "AT14: a score is rounded down to a whole percentage",
        earned: 1,
        possible: 3,
        expected: 33,
      },
      {
        name: "AT14: a score is rounded up to a whole percentage",
        earned: 2,
        possible: 3,
        expected: 67,
      },
      {
        name: "AT14: a half percent rounds up, never truncates",
        earned: 1,
        possible: 8,
        expected: 13,
      },
      {
        name: "AT20: earning everything available scores 100%",
        earned: 40,
        possible: 40,
        expected: 100,
      },
      {
        name: "AT20: the denominator is the whole course, so an untouched scene costs the learner",
        earned: 10,
        possible: 40,
        expected: 25,
      },
    ] as const)("$name", ({ earned, possible, expected }) => {
      expect(computeScorePct(earned, possible)).toBe(expected);
    });
  });

  describe("passing", () => {
    it.each([
      {
        name: "AT10: a score exactly at the threshold passes",
        scorePct: 80,
        passingScorePct: 80,
        expected: true,
      },
      {
        name: "AT10: a score one point below the threshold fails",
        scorePct: 79,
        passingScorePct: 80,
        expected: false,
      },
      {
        name: "AT11: a course with no threshold is passed by finishing it",
        scorePct: 0,
        passingScorePct: null,
        expected: true,
      },
      {
        name: "AT11: no threshold passes even with no score",
        scorePct: null,
        passingScorePct: null,
        expected: true,
      },
      {
        name: "AT12: a learner with no score has not passed",
        scorePct: null,
        passingScorePct: 80,
        expected: false,
      },
    ] as const)("$name", ({ scorePct, passingScorePct, expected }) => {
      expect(passesScore(scorePct, passingScorePct)).toBe(expected);
    });

    it.each([
      {
        name: "AT15: a learner mid-attempt has not passed, whatever the threshold",
        status: EnrollmentStatus.IN_PROGRESS,
        scorePct: null,
        passingScorePct: null,
        expected: false,
      },
      {
        name: "AT15: a mid-attempt learner does not pass on a score alone",
        status: EnrollmentStatus.IN_PROGRESS,
        scorePct: 100,
        passingScorePct: 80,
        expected: false,
      },
      {
        name: "AT15: a learner who never started has not passed",
        status: EnrollmentStatus.NOT_STARTED,
        scorePct: null,
        passingScorePct: null,
        expected: false,
      },
      {
        name: "AT15: a finished learner at the threshold has passed",
        status: EnrollmentStatus.COMPLETED,
        scorePct: 80,
        passingScorePct: 80,
        expected: true,
      },
      {
        name: "AT15: a finished learner below the threshold has not passed",
        status: EnrollmentStatus.COMPLETED,
        scorePct: 79,
        passingScorePct: 80,
        expected: false,
      },
    ] as const)("$name", ({ status, scorePct, passingScorePct, expected }) => {
      expect(evaluatePassState({ status, scorePct, passingScorePct })).toBe(
        expected,
      );
    });
  });

  describe("the attempt cap", () => {
    it.each([
      {
        name: "AT16: no cap always allows another try",
        triesUsed: 99,
        maxTries: null,
        expected: true,
      },
      {
        name: "AT17: a learner below the cap has a try remaining",
        triesUsed: 1,
        maxTries: 2,
        expected: true,
      },
      {
        name: "AT17: a learner exactly at the cap has none remaining",
        triesUsed: 2,
        maxTries: 2,
        expected: false,
      },
      {
        name: "AT17: a learner past the cap has none remaining",
        triesUsed: 3,
        maxTries: 2,
        expected: false,
      },
      {
        name: "AT17: a cap of zero grants no try at all",
        triesUsed: 0,
        maxTries: 0,
        expected: false,
      },
    ] as const)("$name", ({ triesUsed, maxTries, expected }) => {
      expect(hasAttemptsRemaining(triesUsed, maxTries)).toBe(expected);
    });
  });

  describe("attempt numbering", () => {
    it.each([
      {
        name: "AT19: a learner who never started is on attempt 1",
        status: EnrollmentStatus.NOT_STARTED,
        triesUsed: 0,
        expected: 1,
      },
      {
        name: "AT18: an attempt in progress has not yet consumed its try",
        status: EnrollmentStatus.IN_PROGRESS,
        triesUsed: 0,
        expected: 1,
      },
      {
        name: "AT18: a finished attempt has consumed its try and keeps its number",
        status: EnrollmentStatus.COMPLETED,
        triesUsed: 1,
        expected: 1,
      },
      {
        name: "AT19: a retry after one finished attempt is numbered 2, never reusing 1",
        status: EnrollmentStatus.IN_PROGRESS,
        triesUsed: 1,
        expected: 2,
      },
    ] as const)("$name", ({ status, triesUsed, expected }) => {
      expect(getActiveAttempt({ status, triesUsed })).toBe(expected);
    });
  });
});
