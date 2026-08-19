import type { NotebookState } from "../chat/runtime/context";
import type { SidebarState } from "../workspace/hooks/use-sidebar-state";
import type { AgentTarget } from "./course-builder-store";

export function shouldFlagStudioActivity(params: {
  chatStatus: NotebookState["status"];
  agentTarget: AgentTarget | undefined;
  rightSidebarTab: SidebarState["rightSidebarTab"];
  isSidebarOpen: boolean;
}): boolean {
  if (!params.agentTarget) return false;
  if (params.rightSidebarTab === "studio" && params.isSidebarOpen) return false;
  return params.chatStatus === "submitted" || params.chatStatus === "streaming";
}

export function agentFollowOffer(state: {
  isFollowingAgent: boolean;
  agentTarget: AgentTarget | undefined;
  chatStatus: NotebookState["status"];
}): AgentTarget | undefined {
  if (state.isFollowingAgent) return undefined;
  if (!state.agentTarget?.course) return undefined;
  if (state.chatStatus !== "submitted" && state.chatStatus !== "streaming") {
    return undefined;
  }
  return state.agentTarget;
}
