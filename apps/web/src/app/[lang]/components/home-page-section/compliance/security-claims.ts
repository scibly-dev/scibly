import {
  Globe,
  Lock,
  type LucideIcon,
  ShieldBan,
  ShieldCheck,
} from "lucide-react";

import { type Pillar, PILLARS } from "@/app/[lang]/components/marketing-tokens";

export const SECURITY_CLAIM_IDS = [
  "gdpr",
  "euServer",
  "noTraining",
  "aes",
] as const;

export type SecurityClaimId = (typeof SECURITY_CLAIM_IDS)[number];

export const toSecurityClaimId = (id: string): SecurityClaimId | undefined =>
  SECURITY_CLAIM_IDS.find((known) => known === id);

export type SecurityClaim = {
  pillar: Pillar;
  icon: LucideIcon;

  pressedFace: string;
  pressedLip: string;
};

export const SECURITY_CLAIMS = {
  gdpr: {
    pillar: PILLARS.learner,
    icon: ShieldCheck,
    pressedFace: "#3f7c00",
    pressedLip: "#2c5600",
  },
  euServer: {
    pillar: PILLARS.import,
    icon: Globe,
    pressedFace: "#1a6fe0",
    pressedLip: "#0f4fae",
  },
  noTraining: {
    pillar: PILLARS.byoai,
    icon: ShieldBan,
    pressedFace: "#5b3fd6",
    pressedLip: "#4326b0",
  },
  aes: {
    pillar: PILLARS.analytics,
    icon: Lock,
    pressedFace: "#b85c00",
    pressedLip: "#8a4200",
  },
} satisfies Record<SecurityClaimId, SecurityClaim>;
