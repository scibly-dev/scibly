import type { ResolvedPlan } from "@scibly/api/entitlement";

import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { describe, expect, it } from "vitest";

import { injectPitchScenes, needsPitchScenes } from "./pitch-placement";

function buildLesson(idPrefix: string, sceneCount: number) {
  return {
    id: `lesson-${idPrefix}`,
    title: `Lesson ${idPrefix}`,
    description: null,
    icon: "BOOK" as const,
    estimatedTimeToCompleteMinutes: 5,
    maxSp: sceneCount * 10,
    scenes: Array.from({ length: sceneCount }, (_, index) => ({
      id: `${idPrefix}${index + 1}`,
      animation: "FADE" as const,
      design: null,
      kind: "content" as const,
    })),
  };
}

const sceneIds = (lesson: { scenes: { id: string }[] }) =>
  lesson.scenes.map((scene) => scene.id);

function resolvedPlan(
  plan: keyof typeof PLAN_CATALOGUE,
  lapsed = false,
): ResolvedPlan {
  return {
    plan: PLAN_CATALOGUE[plan],
    subscription: {
      plan,
      purchasedLearnerSeats: 0,
      status: lapsed ? "CANCELED" : "ACTIVE",
      pastDueSince: null,
      currentPeriodStart: new Date(),
    },
    lapsed,
  };
}

describe("injectPitchScenes", () => {
  it("PP1: a lesson with no scenes gets no pitch", () => {
    expect(injectPitchScenes([buildLesson("a", 0)])[0]!.scenes).toEqual([]);
  });

  it("PP2: a lesson shorter than six scenes gets exactly one pitch, at its end", () => {
    const [lesson] = injectPitchScenes([buildLesson("a", 3)]);

    expect(sceneIds(lesson!)).toEqual(["a1", "a2", "a3", "pitch-1"]);
  });

  it("PP2: a pitch is a fading, undesigned scene of its own kind", () => {
    const [lesson] = injectPitchScenes([buildLesson("a", 1)]);

    expect(lesson!.scenes[1]).toEqual({
      id: "pitch-1",
      animation: "FADE",
      design: null,
      kind: "pitch",
    });
  });

  it("PP3: a six-scene lesson gets one pitch, not an every-sixth pitch plus a lesson-end pitch", () => {
    const [lesson] = injectPitchScenes([buildLesson("a", 6)]);

    expect(sceneIds(lesson!)).toEqual([
      ...["a1", "a2", "a3", "a4", "a5", "a6"],
      "pitch-1",
    ]);
  });

  it("PP4: past six scenes, a pitch lands after every sixth scene and at the lesson end", () => {
    const [lesson] = injectPitchScenes([buildLesson("a", 8)]);

    expect(sceneIds(lesson!)).toEqual([
      ...["a1", "a2", "a3", "a4", "a5", "a6"],
      "pitch-1",
      "a7",
      "a8",
      "pitch-2",
    ]);
  });

  it("PP5: the six-scene counter restarts after every pitch", () => {
    const [lesson] = injectPitchScenes([buildLesson("a", 13)]);

    expect(sceneIds(lesson!)).toEqual([
      ...["a1", "a2", "a3", "a4", "a5", "a6"],
      "pitch-1",
      ...["a7", "a8", "a9", "a10", "a11", "a12"],
      "pitch-2",
      "a13",
      "pitch-3",
    ]);
  });

  it("PP6: each lesson starts its count fresh, and pitch ids stay unique across the course", () => {
    const [first, second] = injectPitchScenes([
      buildLesson("a", 2),
      buildLesson("b", 7),
    ]);

    expect(sceneIds(first!)).toEqual(["a1", "a2", "pitch-1"]);
    expect(sceneIds(second!)).toEqual([
      ...["b1", "b2", "b3", "b4", "b5", "b6"],
      "pitch-2",
      "b7",
      "pitch-3",
    ]);
  });

  it("PP7: everything about the lesson besides its scene list is untouched", () => {
    const input = buildLesson("a", 4);

    const [lesson] = injectPitchScenes([input]);

    const { scenes: inputScenes, ...inputRest } = input;
    const { scenes: injected, ...outputRest } = lesson!;
    expect(outputRest).toEqual(inputRest);
    expect(injected.filter((scene) => scene.kind !== "pitch")).toEqual(
      inputScenes,
    );
  });
});

describe("needsPitchScenes", () => {
  it.each(["TRIAL", "INTERNAL"] as const)(
    "PP8: an org on the %s plan sees pitches",
    (plan) => {
      expect(needsPitchScenes(resolvedPlan(plan))).toBe(true);
    },
  );

  it.each(["STARTER", "BUSINESS", "PRO"] as const)(
    "PP9: an org paying for %s never sees a pitch",
    (plan) => {
      expect(needsPitchScenes(resolvedPlan(plan))).toBe(false);
    },
  );

  it("PP10: a lapsed paid org sees pitches again", () => {
    expect(needsPitchScenes(resolvedPlan("PRO", true))).toBe(true);
  });

  it("PP11: an unresolvable subscription fails closed to pitching", () => {
    expect(needsPitchScenes(null)).toBe(true);
  });
});
