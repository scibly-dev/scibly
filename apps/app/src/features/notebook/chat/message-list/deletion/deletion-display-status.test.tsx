import type {
  DeletionDisplayStatus,
  DeletionInvocation,
} from "./deletion.types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { notebookTranslations } from "../__tests__/scripted-chat";
import { DeletionConfirmationCard } from "./deletion-confirmation-card";

// One card per status, so only what the status draws is real here: the
// approval round trip has its own suite, and navigation has nothing to say
// about a card that is only being read.
const approval = { isResponding: false, localError: null as string | null };

vi.mock("./use-deletion-approval", () => ({
  useDeletionApproval: () => ({
    canRespond: true,
    handleApprove: vi.fn(),
    handleDeny: vi.fn(),
    isResponding: approval.isResponding,
    localError: approval.localError,
  }),
}));

vi.mock("./use-deletion-navigation-context", () => ({
  useDeletionNavigationContext: () => ({
    courseId: "course-1",
    courseTitle: undefined,
    focusLesson: undefined,
    isCourseOpenInBuilder: true,
    isNavigationLoading: false,
  }),
}));

vi.mock("@/shared/api/trpc/client", () => ({ api: { useUtils: () => ({}) } }));

const t = notebookTranslations;
const cb = t.studio.courseBuilder;

function invocation(status: DeletionDisplayStatus): DeletionInvocation {
  return {
    key: "deletion-0",
    kind: "scene",
    items: [{ id: "scene-1", title: "Intro" }],
    courseId: "course-1",
    approval: { approvalId: "approval-1", toolCallId: "call-1" },
    partIndex: 0,
    status,
    errorText: "Cannot delete the only scene in a lesson.",
  };
}

function renderStatus(
  status: DeletionDisplayStatus,
  overrides: Partial<typeof approval> = {},
) {
  approval.isResponding = overrides.isResponding ?? false;
  approval.localError = overrides.localError ?? null;
  return render(
    <DeletionConfirmationCard invocation={invocation(status)} t={t} />,
  );
}

describe("every deletion status draws exactly one thing", () => {
  it("streaming draws nothing — there is no deletion to read yet", () => {
    const { container } = renderStatus("streaming");
    expect(container.innerHTML).toBe("");
  });

  it("awaiting-approval draws the confirm button, not a banner", () => {
    renderStatus("awaiting-approval");
    expect(screen.queryByText(cb.confirmDelete)).not.toBeNull();
    expect(screen.queryByText(cb.deletionProcessing)).toBeNull();
  });

  it("deleting draws the in-flight banner", () => {
    renderStatus("awaiting-approval", { isResponding: true });
    expect(screen.queryByText(cb.deletionProcessing)).not.toBeNull();
  });

  it("deleted draws the completed banner", () => {
    renderStatus("deleted");
    expect(screen.queryByText(cb.deletionSceneCompleted)).not.toBeNull();
  });

  it("denied draws the cancelled banner", () => {
    renderStatus("denied");
    expect(screen.queryByText(cb.deletionCancelled)).not.toBeNull();
  });

  it("failed draws the error banner, with what went wrong", () => {
    renderStatus("failed");
    expect(screen.queryByText(cb.deletionFailed)).not.toBeNull();
    expect(screen.queryByText(/only scene/)).not.toBeNull();
  });

  it("a mutation this browser failed is an error, not a silent card", () => {
    renderStatus("awaiting-approval", { localError: "Network unavailable." });
    expect(screen.queryByText(cb.deletionFailed)).not.toBeNull();
    expect(screen.queryByText("Network unavailable.")).not.toBeNull();
  });

  it("a deletion that landed stays deleted even if a later call failed", () => {
    renderStatus("deleted", { localError: "Network unavailable." });
    expect(screen.queryByText(cb.deletionSceneCompleted)).not.toBeNull();
  });
});
