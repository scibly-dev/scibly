import { LessonIcon } from "@scibly/db/enums";
import {
  BookOpen,
  ClipboardCheck,
  Flag,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

export const LESSON_ICON_OPTIONS = [
  LessonIcon.BOOK,
  LessonIcon.LIGHTBULB,
  LessonIcon.PRACTICE,
  LessonIcon.MILESTONE,
] as const;

export const LESSON_ICON_MAP = {
  [LessonIcon.BOOK]: BookOpen,
  [LessonIcon.LIGHTBULB]: Lightbulb,
  [LessonIcon.PRACTICE]: ClipboardCheck,
  [LessonIcon.MILESTONE]: Flag,
} satisfies Record<LessonIcon, LucideIcon>;

const LEGACY_LESSON_ICON_ALIASES = new Map<string, LessonIcon>([
  ["CODE", LessonIcon.PRACTICE],
  ["CHART", LessonIcon.PRACTICE],
  ["QUIZ", LessonIcon.PRACTICE],
  ["TROPHY", LessonIcon.MILESTONE],
]);

export function normalizeLessonIcon(
  icon: string | null | undefined,
): LessonIcon {
  if (!icon) return LessonIcon.BOOK;
  return (
    LESSON_ICON_OPTIONS.find((option) => option === icon) ??
    LEGACY_LESSON_ICON_ALIASES.get(icon) ??
    LessonIcon.BOOK
  );
}

export function getDefaultLessonIconForOrder(order: number): LessonIcon {
  const index =
    ((order % LESSON_ICON_OPTIONS.length) + LESSON_ICON_OPTIONS.length) %
    LESSON_ICON_OPTIONS.length;
  return LESSON_ICON_OPTIONS[index]!;
}
