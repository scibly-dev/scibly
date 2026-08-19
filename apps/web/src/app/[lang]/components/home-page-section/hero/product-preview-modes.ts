import { type Pillar, PILLARS } from "@/app/[lang]/components/marketing-tokens";

export type ProductPreviewTab = "notebook" | "courseBuilder" | "gamification";

export const WORKSPACE_PILLARS = {
  notebook: PILLARS.import,
  courseBuilder: PILLARS.byoai,
  gamification: PILLARS.learner,
} satisfies Record<ProductPreviewTab, Pillar>;
