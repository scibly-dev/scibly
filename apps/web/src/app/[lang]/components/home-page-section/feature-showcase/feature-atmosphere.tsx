import {
  ArrowDownToLine,
  Bot,
  ChartNoAxesCombined,
  GraduationCap,
  MessagesSquare,
} from "lucide-react";

import {
  type AtmosphereTile,
  MarketingAtmosphere,
} from "@/app/[lang]/components/marketing-grid-field";
import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

const featureTiles: AtmosphereTile[] = [
  {
    id: "import",
    className: "top-[250px] right-[8%] hidden xl:flex",
    icon: <ArrowDownToLine size={25} strokeWidth={1.8} />,
    tone: PILLARS.import,
  },
  {
    id: "channels",
    className: "top-[29%] left-[5%] hidden xl:flex",
    icon: <MessagesSquare size={25} strokeWidth={1.8} />,
    tone: PILLARS.channels,
  },
  {
    id: "learner",
    className: "top-[44%] right-[6%] hidden xl:flex",
    icon: <GraduationCap size={26} strokeWidth={1.8} />,
    tone: PILLARS.learner,
  },
  {
    id: "analytics",
    className: "top-[62%] left-[7%] hidden xl:flex",
    icon: <ChartNoAxesCombined size={25} strokeWidth={1.8} />,
    tone: PILLARS.analytics,
  },
  {
    id: "byoai",
    className: "top-[78%] right-[5%] hidden xl:flex",
    icon: <Bot size={26} strokeWidth={1.8} />,
    tone: PILLARS.byoai,
  },
];

const featureIndents = ["top-[88%] left-[4%] hidden xl:block"];

export function FeatureAtmosphere() {
  return <MarketingAtmosphere tiles={featureTiles} indents={featureIndents} />;
}
