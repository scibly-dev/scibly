import { z } from "zod";

export const LESSON_DESCRIPTION_MAX_LENGTH = 200;

export const lessonDescriptionSchema = z
  .string()
  .max(LESSON_DESCRIPTION_MAX_LENGTH);

export function normalizeLessonDescriptionInput(value: string): string {
  return value.slice(0, LESSON_DESCRIPTION_MAX_LENGTH);
}
