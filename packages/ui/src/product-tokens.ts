const POSITIVE_ACTION = "bg-[#58cc02] text-white";
const QA_CORRECT_BORDER = "border-[#afe27a]";
const QA_CORRECT_SURFACE = "bg-[#d7ffb8]";
const QA_CORRECT_TEXT = "text-[#58a700]";

export const QA_PRODUCT_TOKENS = {
  correctBorder: QA_CORRECT_BORDER,
  correctSurface: QA_CORRECT_SURFACE,
  correctText: QA_CORRECT_TEXT,
  correctFace: `${QA_CORRECT_BORDER} ${QA_CORRECT_SURFACE} ${QA_CORRECT_TEXT}`,
  submittedFace: `${QA_CORRECT_BORDER} ${QA_CORRECT_SURFACE}`,
  positiveAction: POSITIVE_ACTION,
  bankSurface: "bg-ground-soft",
  emptySlotSurface: "bg-hairline",
} as const;

export const PERFECT_FEEDBACK_TOKENS = {
  shell: QA_CORRECT_SURFACE,
  title: QA_CORRECT_TEXT,
  iconBg: "bg-[#58cc02] shadow-[0_3px_0_0_#46a302]",
  action: POSITIVE_ACTION,
} as const;

// Uses the brand blue (every primary action's colour), leaving green to mean only "correct answer".
export const COURSE_HIGHLIGHT_TOKENS = {
  primary: "#0066ff",
  primaryDark: "#0b52cc",
  completed: "#0f6fe6",
  pathActive: "#7ab4ff",
  pathInactive: "#dedbd2",
  locked: "#f1efe9",
  lockedIcon: "#8a94b4",
} as const;

// Deliberately has no palette of its own — borrows the shared ink ramp and hairline/ground surfaces instead.
export const NOTEBOOK_PRODUCT_TOKENS = {
  workspaceSurface: "bg-ground",
  divider: "border-hairline",
  dividerBackground: "bg-hairline",
  insetSurface: "bg-ground",
  subduedSurface: "bg-ground",
  strongText: "text-ink",
  secondaryText: "text-ink-muted",
  mutedText: "text-ink-faint",
} as const;
