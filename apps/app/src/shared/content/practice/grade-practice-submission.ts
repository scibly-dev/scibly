import isEqual from "react-fast-compare";

export type PracticeSolutionField = {
  value: unknown;
  points: number;
  eps?: number;
};

export type PracticeGradingManifest = {
  solution: Record<string, PracticeSolutionField> | null;
  explain: string | null;
};

/** Mirrors `GradedBlock` so it shares the `SceneAnalytics.gradedBlocks` column. */
export type PracticeGradedField = {
  blockId: string;
  blockType: "practice";
  achievedPoints: number;
  maxPoints: number;
  spEarned: number;
  correctAnswer?: unknown;
};

/** Deep rather than serialized: `practiceSolution` is JSONB, and Postgres renormalizes key order. */
function fieldMatches(
  submitted: unknown,
  spec: PracticeSolutionField,
): boolean {
  if (Array.isArray(spec.value)) {
    if (!Array.isArray(submitted)) return false;
    if (submitted.length !== spec.value.length) return false;
    const unmatched = [...submitted];
    return spec.value.every((expected) => {
      const at = unmatched.findIndex((actual) => isEqual(actual, expected));
      if (at === -1) return false;
      unmatched.splice(at, 1);
      return true;
    });
  }
  if (typeof spec.value === "number" && typeof submitted === "number") {
    return Math.abs(submitted - spec.value) <= (spec.eps ?? 0);
  }
  return isEqual(submitted, spec.value);
}

/** `maxPoints > 0` only bites on solutions stored before the schema refused `points: 0`. */
export function isFieldCorrect(field: {
  achievedPoints: number;
  maxPoints: number;
}): boolean {
  return field.maxPoints > 0 && field.achievedPoints >= field.maxPoints;
}

export type PracticeGradingResult = {
  gradedFields: PracticeGradedField[];
  totalSpEarned: number;
  explanation: string | null;
};

function submittedFields(work: unknown): Map<string, unknown> {
  return new Map(
    typeof work === "object" && work !== null && !Array.isArray(work)
      ? Object.entries(work)
      : [],
  );
}

export function gradePracticeSubmission(
  work: unknown,
  manifest: PracticeGradingManifest,
  sceneSp: number,
): PracticeGradingResult {
  const { solution, explain } = manifest;
  if (!solution) {
    return { gradedFields: [], totalSpEarned: sceneSp, explanation: explain };
  }

  const submitted = submittedFields(work);

  const gradedFields: PracticeGradedField[] = Object.entries(solution).map(
    ([field, spec]) => {
      const achievedPoints = fieldMatches(submitted.get(field), spec)
        ? spec.points
        : 0;
      return {
        blockId: field,
        blockType: "practice",
        achievedPoints,
        maxPoints: spec.points,
        spEarned: achievedPoints,
        correctAnswer: spec.value,
      };
    },
  );

  const fieldSp = gradedFields.reduce((sum, f) => sum + f.spEarned, 0);
  return {
    gradedFields,
    totalSpEarned: sceneSp + fieldSp,
    explanation: explain,
  };
}
