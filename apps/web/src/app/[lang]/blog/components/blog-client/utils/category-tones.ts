import type { BlogPost } from "@/app/[lang]/blog/components/posts";

import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

export const CATEGORY_TONES = {
  education: PILLARS.learner,
  product: PILLARS.import,
  engineering: PILLARS.channels,
  design: PILLARS.byoai,
  company: PILLARS.analytics,
} satisfies Record<
  BlogPost["category"],
  (typeof PILLARS)[keyof typeof PILLARS]
>;
