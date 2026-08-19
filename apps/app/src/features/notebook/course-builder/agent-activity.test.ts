import type { AgentTarget } from "@/features/notebook/course-builder/course-builder-store";

import { describe, expect, it } from "vitest";

import {
  agentFollowOffer,
  shouldFlagStudioActivity,
} from "@/features/notebook/course-builder/agent-activity";

const COURSE = { id: "course-a", title: "Cyber Safety" };
const LESSON = { id: "lesson-a1", title: "Spotting phishing" };
const SCENE = { id: "scene-a1", title: "Introduction" };

const WORKING: AgentTarget = {
  course: COURSE,
  lesson: LESSON,
  scene: SCENE,
};

describe("JS3 — the Studio tab says something is happening", () => {
  it.each([["submitted"], ["streaming"]] as const)(
    "JS3: %s work the author cannot see is flagged",
    (chatStatus) => {
      expect(
        shouldFlagStudioActivity({
          chatStatus,
          agentTarget: WORKING,
          rightSidebarTab: "sources",
          isSidebarOpen: true,
        }),
      ).toBe(true);
    },
  );

  it("JS3: work the author is already watching is not flagged", () => {
    expect(
      shouldFlagStudioActivity({
        chatStatus: "streaming",
        agentTarget: WORKING,
        rightSidebarTab: "studio",
        isSidebarOpen: true,
      }),
    ).toBe(false);
  });

  it("JS3: the studio tab behind a closed sidebar is still off screen", () => {
    expect(
      shouldFlagStudioActivity({
        chatStatus: "streaming",
        agentTarget: WORKING,
        rightSidebarTab: "studio",
        isSidebarOpen: false,
      }),
    ).toBe(true);
  });

  it.each([["ready"], ["error"]] as const)(
    "JS3: a turn that is %s flags nothing — the indicator means *now*",
    (chatStatus) => {
      expect(
        shouldFlagStudioActivity({
          chatStatus,
          agentTarget: WORKING,
          rightSidebarTab: "sources",
          isSidebarOpen: true,
        }),
      ).toBe(false);
    },
  );

  it("JS3: a turn that has touched no course flags nothing", () => {
    expect(
      shouldFlagStudioActivity({
        chatStatus: "streaming",
        agentTarget: undefined,
        rightSidebarTab: "sources",
        isSidebarOpen: true,
      }),
    ).toBe(false);
  });
});

describe("JD4 — the builder offers to follow the agent", () => {
  it.each([["submitted"], ["streaming"]] as const)(
    "JD4: a detached builder names what the agent is working on while %s",
    (chatStatus) => {
      expect(
        agentFollowOffer({
          isFollowingAgent: false,
          agentTarget: WORKING,
          chatStatus,
        }),
      ).toEqual(WORKING);
    },
  );

  it.each([["ready"], ["error"]] as const)(
    "JD4: a turn that is %s offers nothing — the banner must not outlive the turn",
    (chatStatus) => {
      expect(
        agentFollowOffer({
          isFollowingAgent: false,
          agentTarget: WORKING,
          chatStatus,
        }),
      ).toBeUndefined();
    },
  );

  it("JD4: a builder that is already following offers nothing", () => {
    expect(
      agentFollowOffer({
        isFollowingAgent: true,
        agentTarget: WORKING,
        chatStatus: "streaming",
      }),
    ).toBeUndefined();
  });

  it("JD4: an agent that has touched nothing yet offers nothing", () => {
    expect(
      agentFollowOffer({
        isFollowingAgent: false,
        agentTarget: undefined,
        chatStatus: "streaming",
      }),
    ).toBeUndefined();
  });

  it("JD4: a target whose course could not be resolved offers nothing", () => {
    expect(
      agentFollowOffer({
        isFollowingAgent: false,
        agentTarget: { course: undefined, lesson: LESSON, scene: SCENE },
        chatStatus: "streaming",
      }),
    ).toBeUndefined();
  });
});
