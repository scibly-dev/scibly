import { Blocks, Gamepad2, NotebookPen } from "lucide-react";

import {
  type AtmosphereTile,
  MarketingAtmosphere,
} from "@/app/[lang]/components/marketing-grid-field";

import { WORKSPACE_PILLARS } from "./product-preview-modes";

const modeTiles: AtmosphereTile[] = [
  {
    id: "notebook",
    className: "top-[18%] right-[5%] hidden xl:flex",
    icon: <NotebookPen size={25} strokeWidth={1.8} />,
    tone: WORKSPACE_PILLARS.notebook,
  },
  {
    id: "courseBuilder",
    className: "top-[50%] left-[4%] hidden xl:flex",
    icon: <Blocks size={26} strokeWidth={1.8} />,
    tone: WORKSPACE_PILLARS.courseBuilder,
  },
  {
    id: "gamification",
    className: "right-[7%] bottom-[10%] hidden xl:flex",
    icon: <Gamepad2 size={26} strokeWidth={1.8} />,
    tone: WORKSPACE_PILLARS.gamification,
  },
];

const modeIndents = [
  "top-[31%] left-[7%] hidden xl:block",
  "right-[4%] bottom-[34%] hidden xl:block",
];

export function ProductPreviewAtmosphere() {
  return <MarketingAtmosphere tiles={modeTiles} indents={modeIndents} />;
}
