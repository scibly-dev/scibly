export const THEME_MAP = {
  default:
    "[&_.flashcard-face]:bg-white dark:[&_.flashcard-face]:bg-neutral-900 [&_.flashcard-face]:border-neutral-200 dark:[&_.flashcard-face]:border-neutral-800",
  blue: "[&_.flashcard-face]:bg-blue-50 dark:[&_.flashcard-face]:bg-blue-900/20 [&_.flashcard-face]:border-blue-200 dark:[&_.flashcard-face]:border-blue-800",
  green:
    "[&_.flashcard-face]:bg-green-50 dark:[&_.flashcard-face]:bg-green-900/20 [&_.flashcard-face]:border-green-200 dark:[&_.flashcard-face]:border-green-800",
  yellow:
    "[&_.flashcard-face]:bg-yellow-50 dark:[&_.flashcard-face]:bg-yellow-900/20 [&_.flashcard-face]:border-yellow-200 dark:[&_.flashcard-face]:border-yellow-800",
} as const;

export type FlashcardTheme = keyof typeof THEME_MAP;
