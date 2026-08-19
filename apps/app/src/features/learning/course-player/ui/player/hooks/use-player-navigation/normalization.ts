import type {
  NormalizedCourse,
  RawMemberCourse,
  RawPreviewCourse,
  RawPublicCourse,
} from "./types";

export function normalizeCourse(
  raw: RawMemberCourse | RawPublicCourse,
): NormalizedCourse {
  return {
    id: raw.id,
    title: raw.title,
    mode: raw.mode,
    passingScorePct: raw.passingScorePct ?? null,
    maxTries: raw.maxTries ?? null,
    maxSp: raw.maxSp,
    lessons: raw.lessons,
    organization: "organization" in raw ? (raw.organization ?? null) : null,
    courseVersionId: raw.courseVersionId,
    version: raw.version,
    thumbnail: raw.thumbnail,
  };
}

export function normalizePreviewCourse(
  raw: RawPreviewCourse,
): NormalizedCourse {
  return {
    id: raw.id,
    title: raw.title,
    mode: raw.mode,
    passingScorePct: raw.passingScorePct ?? null,
    maxTries: raw.maxTries ?? null,
    maxSp: raw.maxSp,
    lessons: raw.lessons,
    organization: null,
    courseVersionId: "",
    version: 0,
    thumbnail: raw.thumbnail,
  };
}
