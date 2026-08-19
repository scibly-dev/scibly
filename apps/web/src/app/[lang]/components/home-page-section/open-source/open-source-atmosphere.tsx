import { Braces, Container, GitFork, Terminal } from "lucide-react";

import {
  type AtmosphereTile,
  MarketingAtmosphere,
} from "@/app/[lang]/components/marketing-grid-field";
import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

const tiles: AtmosphereTile[] = [
  {
    id: "terminal",
    className: "top-[16%] left-[3.5%] hidden xl:flex",
    icon: <Terminal size={24} strokeWidth={1.8} />,
    tone: PILLARS.import,
  },
  {
    id: "fork",
    className: "top-[24%] right-[4%] hidden xl:flex",
    icon: <GitFork size={24} strokeWidth={1.8} />,
    tone: PILLARS.byoai,
  },
  {
    id: "container",
    className: "bottom-[18%] left-[5%] hidden 2xl:flex",
    icon: <Container size={23} strokeWidth={1.8} />,
    tone: PILLARS.channels,
  },
  {
    id: "braces",
    className: "right-[3.5%] bottom-[15%] hidden 2xl:flex",
    icon: <Braces size={23} strokeWidth={1.8} />,
    tone: PILLARS.learner,
  },
];

const indents = [
  "top-[54%] left-[4%] hidden xl:block",
  "top-[62%] right-[5%] hidden xl:block",
];

export function OpenSourceAtmosphere() {
  return <MarketingAtmosphere tiles={tiles} indents={indents} />;
}
