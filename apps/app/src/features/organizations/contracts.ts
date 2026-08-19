import { type RouterOutputs } from "@/shared/api/trpc/contracts";

export type GateDecision =
  RouterOutputs["billing"]["getFeatureAccess"]["byoai"];
export type { OrgSettingsPage } from "./settings/i18n/org-settings.types";
