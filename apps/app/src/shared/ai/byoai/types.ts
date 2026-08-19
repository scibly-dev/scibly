import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

export const BYOAI_MODEL_TYPES = ["CHAT", "IMAGE"] as const;

export type ByoaiModelType = (typeof BYOAI_MODEL_TYPES)[number];

export type OrgByoaiModel =
  inferRouterOutputs<AppRouter>["orgAiConfig"]["listModels"][number];
