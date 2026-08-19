import { MODERN_MINIMAL_DESIGN } from "@/shared/content/course/course-validation";

export const DESIGN_PRESETS = [
  {
    value: "modern",
    label: "Modern Minimal",
    design: MODERN_MINIMAL_DESIGN,
  },
  {
    value: "playful",
    label: "Playful App",
    design: {
      backgroundColor: "#fdf4ff",
      textColor: "#4a044e",
      primaryColor: "#f472b6",
      fontFamily: "var(--font-sans)",
    },
  },
] as const;
