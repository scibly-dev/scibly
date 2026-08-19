import type { CoursesTranslations } from "@/features/course-authoring/contracts";

import { fireEvent, render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseAdminHero } from "./course-admin-hero";

// What the hero does with the access query's answer, including its non-answer.

const useAccessQuery = vi.hoisted(() => vi.fn());
const useCourseQuery = vi.hoisted(() => vi.fn());

const renderNothing = vi.hoisted(() => () => null);

const publishOpener = vi.hoisted(() => {
  const openPublishDialog = ({ onPublish }: { onPublish: () => void }) => (
    <button type="button" onClick={onPublish}>
      Open publish dialog
    </button>
  );
  return openPublishDialog;
});

const t = {
  detail: {
    publishDialog: {
      title: "Publish course",
      description: "A new version will be created.",
      gateDialogDescription: "Publishing is not included in your plan.",
      gateTitle: "Publishing needs {{plan}} or above",
      gateDescription: "Upgrade to {{plan}} to publish this course.",
      gateLapsedTitle: "Your subscription has lapsed",
      gateLapsedDescription: "Renew to publish again.",
      gateFallbackPlan: "a paid plan",
      gateViewPlans: "View plans",
      supersedeLabel: "Invalidate previous version",
      supersedeDescription: "Learners restart the course.",
      cancel: "Cancel",
      publishing: "Publishing…",
      confirmPublish: "Publish",
      confirmForce: "Publish anyway",
    },
    toastPublishSuccess: "Published v{{version}}",
    toastPublishFailed: "Publish failed",
  },
} as CoursesTranslations;

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({}),
    billing: { getFeatureAccess: { useQuery: useAccessQuery } },
    course: {
      getById: { useQuery: useCourseQuery },
      publishCourse: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));
vi.mock("@/i18n/hooks/use-translation", () => ({
  useTranslation: () => ({ translations: t }),
}));
vi.mock("./course-hero-banner", () => ({ CourseHeroBanner: renderNothing }));
vi.mock("./course-edit-sheet", () => ({ CourseEditSheet: renderNothing }));
vi.mock("./course-share-dialog", () => ({ CourseShareDialog: renderNothing }));
vi.mock("./course-cover-control", () => ({
  CourseCoverControl: renderNothing,
}));
vi.mock("./course-hero-actions", () => ({ CourseHeroActions: publishOpener }));

function openDialog(access: unknown) {
  useAccessQuery.mockReturnValue({ data: access });
  const { baseElement, getByText } = render(
    <CourseAdminHero courseId="c-1" orgSlug="acme" />,
  );
  fireEvent.click(getByText("Open publish dialog"));
  return within(baseElement);
}

beforeEach(() => {
  vi.clearAllMocks();
  useCourseQuery.mockReturnValue({
    data: { _count: { lessons: 3 }, thumbnail: null, versions: [] },
  });
});

describe("SP1 — a refused plan replaces the dialog's body", () => {
  it("shows the gate notice and no Publish button", () => {
    const queries = openDialog({
      publish: {
        allowed: false,
        reason: "not_in_plan",
        requiredPlan: "Starter",
      },
    });

    expect(
      queries.queryByText("Publishing needs Starter or above"),
    ).not.toBeNull();
    expect(queries.queryByText("Publish")).toBeNull();
  });
});

describe("SP4 — an unanswered query leaves the dialog exactly as it was", () => {
  it("still offers Publish while the plan is being read", () => {
    const queries = openDialog(undefined);

    expect(queries.queryByText("Publish")).not.toBeNull();
    expect(queries.queryByText(/Publishing needs/)).toBeNull();
  });

  it("still offers Publish to a plan that includes it", () => {
    const queries = openDialog({
      publish: { allowed: true, reason: null, requiredPlan: "Starter" },
    });

    expect(queries.queryByText("Publish")).not.toBeNull();
  });
});
