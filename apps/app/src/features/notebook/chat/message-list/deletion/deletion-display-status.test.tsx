import type {
  DeletionDisplayStatus,
  DeletionInvocation,
  DeletionResolution,
} from "./deletion.types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { notebookTranslations } from "../__tests__/scripted-chat";
import { DeletionConfirmationCard } from "./deletion-confirmation-card";

const approval = { isResponding: false, localError: null as string | null };

const RESOLVED: DeletionResolution = {
  courseTitle: "Biology",
  items: [{ id: "scene-1", title: "Intro" }],
};

const lookup = {
  isResolving: false,
  resolution: RESOLVED as DeletionResolution | null,
};

const bounced = vi.fn();

vi.mock("./use-deletion-approval", () => ({
  useDeletionApproval: () => ({
    canRespond: true,
    handleApprove: vi.fn(),
    handleDeny: vi.fn(),
    isResponding: approval.isResponding,
    localError: approval.localError,
  }),
  useBounceUnresolvedDeletion: (
    _invocation: DeletionInvocation,
    isUnresolved: boolean,
  ) => {
    if (isUnresolved) bounced();
  },
}));

vi.mock("./use-deletion-resolution", () => ({
  useDeletionResolution: () => ({
    isResolving: lookup.isResolving,
    resolution: lookup.resolution,
    isCourseOpenInBuilder: true,
  }),
}));

vi.mock("@/shared/api/trpc/client", () => ({ api: { useUtils: () => ({}) } }));

const t = notebookTranslations;
const cb = t.studio.courseBuilder;

function invocation(status: DeletionDisplayStatus): DeletionInvocation {
  return {
    key: "deletion-0",
    kind: "scene",
    ids: ["scene-1"],
    courseId: "course-1",
    approval: { approvalId: "approval-1", toolCallId: "call-1" },
    partIndex: 0,
    status,
    errorText: "Cannot delete the only scene in a lesson.",
  };
}

function renderStatus(
  status: DeletionDisplayStatus,
  overrides: Partial<typeof approval & typeof lookup> = {},
) {
  approval.isResponding = overrides.isResponding ?? false;
  approval.localError = overrides.localError ?? null;
  lookup.isResolving = overrides.isResolving ?? false;
  lookup.resolution =
    overrides.resolution === undefined ? RESOLVED : overrides.resolution;
  bounced.mockClear();
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

  it("a card still looking up its names holds the in-flight banner", () => {
    renderStatus("awaiting-approval", { isResolving: true });
    expect(screen.queryByText(cb.deletionProcessing)).not.toBeNull();
    expect(screen.queryByText(cb.confirmDelete)).toBeNull();
  });

  it("names that never resolved draw nothing and go back to the model", () => {
    const { container } = renderStatus("awaiting-approval", {
      resolution: null,
    });
    expect(container.innerHTML).toBe("");
    expect(bounced).toHaveBeenCalled();
  });
});
