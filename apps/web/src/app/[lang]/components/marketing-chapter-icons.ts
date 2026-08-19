import {
  ArrowDownToLine,
  Bot,
  ChartNoAxesCombined,
  GraduationCap,
  type LucideIcon,
  MessagesSquare,
} from "lucide-react";

import { type PillarId } from "./marketing-tokens";

export const CHAPTER_ICONS = {
  import: ArrowDownToLine,
  channels: MessagesSquare,
  learner: GraduationCap,
  analytics: ChartNoAxesCombined,
  byoai: Bot,
} satisfies Record<PillarId, LucideIcon>;
