import { beforeEach, describe, expect, it } from "vitest";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "@/features/notebook/course-builder/course-builder-store";
import {
  authorOpenedStudioTool,
  authorSelectedSidebarTab,
} from "@/features/notebook/course-builder/hooks/author-attention";

const store = () => useCourseBuilderStore.getState();

beforeEach(() => {
  useCourseBuilderStore.setState(INITIAL_STATE);
});

describe("JA7 — moving attention off the build hands over the wheel", () => {
  it.each([["sources"], ["media"]] as const)(
    "JA7: the %s tab detaches the builder",
    (tab) => {
      authorSelectedSidebarTab(tab);

      expect(store().isFollowingAgent).toBe(false);
    },
  );

  it("JA7: opening another studio tool detaches the builder", () => {
    authorOpenedStudioTool("imageEditor");

    expect(store().isFollowingAgent).toBe(false);
  });
});

describe("JA8 — looking is not driving", () => {
  it("JA8: returning to the studio tab does not detach", () => {
    authorSelectedSidebarTab("studio");

    expect(store().isFollowingAgent).toBe(true);
  });

  it("JA8: returning to the studio tab does not re-attach either", () => {
    authorSelectedSidebarTab("sources");

    authorSelectedSidebarTab("studio");

    expect(store().isFollowingAgent).toBe(false);
  });

  it("JA8: opening the course builder itself is not leaving it", () => {
    authorOpenedStudioTool("courseBuilder");

    expect(store().isFollowingAgent).toBe(true);
  });
});
