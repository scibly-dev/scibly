import {
  type AtmosphereTile,
  MarketingAtmosphere,
} from "@/app/[lang]/components/marketing-grid-field";

import { SECURITY_CLAIMS, type SecurityClaimId } from "./security-claims";

const claimPlacements: Array<{
  id: SecurityClaimId;
  className: string;
  size: number;
}> = [
  { id: "gdpr", className: "top-[18%] right-[4%] hidden xl:flex", size: 24 },
  {
    id: "euServer",
    className: "bottom-[15%] left-[3.5%] hidden xl:flex",
    size: 24,
  },
  {
    id: "noTraining",
    className: "top-[46%] left-[5%] hidden 2xl:flex",
    size: 23,
  },
  {
    id: "aes",
    className: "right-[3.5%] bottom-[13%] hidden 2xl:flex",
    size: 23,
  },
];

const claimTiles: AtmosphereTile[] = claimPlacements.map(
  ({ id, className, size }) => {
    const { icon: Icon, pillar } = SECURITY_CLAIMS[id];
    return {
      id,
      className,
      icon: <Icon size={size} strokeWidth={1.8} />,
      tone: pillar,
    };
  },
);

const claimIndents = [
  "top-[60%] right-[5.5%] hidden xl:block",
  "top-[26%] left-[4%] hidden xl:block",
];

export function ComplianceAtmosphere() {
  return <MarketingAtmosphere tiles={claimTiles} indents={claimIndents} />;
}
