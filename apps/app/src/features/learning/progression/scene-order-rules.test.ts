import type { SequenceViolation } from "./scene-order-rules";

import { describe, expect, it } from "vitest";

import {
  getContiguousCompletedIndex,
  getSequenceViolation,
  isSceneUnlocked,
} from "./scene-order-rules";

// The empty-course case is deliberately absent - publish validation makes it
// unreachable.
const COURSE = ["s1", "s2", "s3"] as const;

const completed = (...sceneIds: string[]): ReadonlySet<string> =>
  new Set(sceneIds);

const describeReachability = (violation: SequenceViolation | null): string =>
  violation ?? "reachable";

describe("scene order rules", () => {
  describe("which scene a learner may reach", () => {
    it.each([
      {
        name: "SO1: the first scene is reachable with nothing completed",
        done: completed(),
        target: "s1",
        expected: "reachable",
      },
      {
        name: "SO2: a scene is reachable once its predecessor is complete",
        done: completed("s1"),
        target: "s2",
        expected: "reachable",
      },
      {
        name: "SO3: a scene whose predecessor is incomplete is out of order",
        done: completed(),
        target: "s2",
        expected: "PREVIOUS_SCENE_INCOMPLETE",
      },
      {
        name: "SO3: an earlier gap holds the learner even when the immediate predecessor is done",
        done: completed("s2"),
        target: "s3",
        expected: "PREVIOUS_SCENE_INCOMPLETE",
      },
      {
        name: "SO4: a scene outside the course version is unknown, not out of order",
        done: completed("s1", "s2"),
        target: "from-another-course",
        expected: "SCENE_NOT_FOUND",
      },
    ] as const)("$name", ({ done, target, expected }) => {
      expect(
        describeReachability(getSequenceViolation(COURSE, done, target)),
      ).toBe(expected);
      expect(isSceneUnlocked(COURSE, done, target)).toBe(
        expected === "reachable",
      );
    });
  });

  describe("how far the learner has got", () => {
    it.each([
      {
        name: "SO5: nothing completed leaves the learner before the first scene",
        order: COURSE,
        done: completed(),
        expected: -1,
      },
      {
        name: "SO5: a completion that skips a scene does not move the frontier",
        order: COURSE,
        done: completed("s1", "s3"),
        expected: 0,
      },
      {
        name: "SO6: a fully completed course reports its last scene",
        order: COURSE,
        done: completed("s1", "s2", "s3"),
        expected: 2,
      },
      {
        name: "SO7: completions from another course version are ignored",
        order: COURSE,
        done: completed("s1", "retired-scene"),
        expected: 0,
      },
    ] as const)("$name", ({ order, done, expected }) => {
      expect(getContiguousCompletedIndex(order, done)).toBe(expected);
    });
  });
});
