import type { KnowledgeTopicsView, KnowledgeTranslations } from "../contracts";

import { FeatureGateNotice } from "@/shared/ui/feature-gate-notice";

export function KnowledgeGateNotice({
  t,
  access,
}: {
  t: KnowledgeTranslations;
  access: KnowledgeTopicsView["access"];
}) {
  if (access.allowed) return null;
  const lapsed = access.reason === "lapsed";
  const plan = access.requiredPlan ?? t.gate.fallbackPlan;
  return (
    <FeatureGateNotice
      title={
        lapsed
          ? t.gate.lapsedTitle
          : t.gate.lockedTitle.replaceAll("{plan}", plan)
      }
      description={
        lapsed
          ? t.gate.lapsedDescription
          : t.gate.lockedDescription.replaceAll("{plan}", plan)
      }
    />
  );
}
