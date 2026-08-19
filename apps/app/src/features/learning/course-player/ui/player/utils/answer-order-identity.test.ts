import { describe, expect, it } from "vitest";

import { playerAnswerOrderIdentity } from "./answer-order-identity";

describe("ORD15 the identity a player hands to the blocks", () => {
  describe("is decided from data present whenever a lesson exists", () => {
    it("uses the enrolment for a member", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "member",
          enrollmentId: "enrol-1",
          restartCount: 0,
        }).learnerId,
      ).toBe("enrol-1");
    });

    it("uses the anonymous session for an anonymous learner", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "anonymous",
          anonymousId: "anon-1",
          restartCount: 0,
        }).learnerId,
      ).toBe("anon-1");
    });

    it("uses the course for an author previewing it", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "preview",
          courseId: "course-1",
          restartCount: 0,
        }).learnerId,
      ).toBe("course-1");
    });
  });

  describe("does not change once the lesson is on screen", () => {
    it.each([
      {
        mode: "member" as const,
        context: { enrollmentId: "enrol-1", triesCount: 2 },
      },
      { mode: "anonymous" as const, context: { anonymousId: "anon-1" } },
      { mode: "preview" as const, context: { courseId: "course-1" } },
    ])("$mode resolves the same identity twice", ({ mode, context }) => {
      const input = { mode, restartCount: 0, ...context };
      expect(playerAnswerOrderIdentity(input)).toEqual(
        playerAnswerOrderIdentity(input),
      );
    });

    it("ignores a course id in member mode, so a member's order does not depend on preview data", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "member",
          enrollmentId: "enrol-1",
          courseId: "course-1",
          restartCount: 0,
        }).learnerId,
      ).toBe("enrol-1");
    });

    it("does not fall back to the course for a member whose enrolment is missing", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "member",
          courseId: "course-1",
          restartCount: 0,
        }).learnerId,
      ).toBeNull();
    });
  });

  describe("carries the attempt (ORD4, ORD11)", () => {
    it("prefers the try counter", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "member",
          enrollmentId: "enrol-1",
          triesCount: 3,
          restartCount: 1,
        }).attempt,
      ).toBe(3);
    });

    it("falls back to the restart counter when there is no try counter", () => {
      expect(
        playerAnswerOrderIdentity({
          mode: "member",
          enrollmentId: "enrol-1",
          restartCount: 1,
        }).attempt,
      ).toBe(1);
    });
  });
});
