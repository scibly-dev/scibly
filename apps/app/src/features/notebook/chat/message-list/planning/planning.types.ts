import type {
  PlanStep,
  ProposePlanOutput,
} from "@/features/notebook/chat/tools/ux-tools";

export interface PlanInvocation {
  toolCallId?: string;
  title: string;
  summary?: string;
  steps: PlanStep[];
  isAnswered: boolean;
  answer?: ProposePlanOutput;
}
