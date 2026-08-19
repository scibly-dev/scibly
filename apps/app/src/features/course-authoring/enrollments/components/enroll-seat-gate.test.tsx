import type { CoursesTranslations } from "@/features/course-authoring/contracts";
import type { GateDecision } from "@/features/organizations/contracts";

import { routes } from "@scibly/routes";
import { render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Registers the doubles below, and must run before the dialog is imported.
// A side-effect import is the one form the import sorter will not move.
import "./testing";

import { CourseEnrollMembersDialog } from "./course-enroll-members-dialog";
import { EnrollMembersDialogView } from "./course-enroll-members-dialog-view";
import { member, useInfiniteQuery, useMutation, useQuery } from "./testing";

const t = {
  detail: {
    enrollDialog: {
      title: "Enroll members",
      desc: "Pick who to enroll.",
      searchPlaceholder: "Search…",
      dueDate: "Due date",
      noMembers: "No available members found.",
      enrollBtn: "Enroll",
      enrollBtnCount: "Enroll ({{count}})",
      cancel: "Cancel",
      seatGateTitle: "Enrolling learners needs {{plan}} or above",
      seatGateDescription: "Your plan includes no learner seats.",
      seatGateLapsedTitle: "This subscription has lapsed",
      seatGateLapsedDescription: "Reactivate it to enroll again.",
      seatGateFallbackPlan: "a paid plan",
      seatGateViewPlans: "View plans",
    },
  },
} as CoursesTranslations;

const gated: GateDecision = {
  allowed: false,
  reason: "not_in_plan",
  requiredPlan: "Starter",
};

function dialog(seatGate: GateDecision | null, selected: string[] = ["u-1"]) {
  const { baseElement } = render(
    <EnrollMembersDialogView
      dueDate=""
      hasNextPage={false}
      loading={false}
      members={[member]}
      onDueDateChange={() => {}}
      onEnroll={() => {}}
      onOpenChange={() => {}}
      onSearchChange={() => {}}
      onToggle={() => {}}
      open
      orgSlug="acme"
      pending={false}
      search=""
      seatGate={seatGate}
      seatShortfall={null}
      selectedIds={new Set(selected)}
      sentinelRef={() => {}}
      t={t}
    />,
  );
  return within(baseElement);
}

const enrollButton = (queries: ReturnType<typeof dialog>) =>
  queries
    .getAllByRole("button")
    .find((button) => button.textContent?.startsWith("Enroll")) as
    | HTMLButtonElement
    | undefined;

describe("SE1 — a seatless plan is told so, and cannot enroll", () => {
  it("names the tier that includes seats", () => {
    expect(
      dialog(gated).queryByText("Enrolling learners needs Starter or above"),
    ).not.toBeNull();
  });

  it("falls back to a generic plan when the catalogue sells none", () => {
    const text = dialog({ ...gated, requiredPlan: null }).getByRole(
      "dialog",
    ).textContent;

    expect(text).toContain("a paid plan");
    expect(text).not.toContain("{{plan}}");
  });

  it("disables Enroll even with people selected", () => {
    expect(enrollButton(dialog(gated))?.disabled).toBe(true);
  });

  it("leaves Enroll live for an organization with seats", () => {
    expect(enrollButton(dialog(null))?.disabled).toBe(false);
  });

  it("links to where seats are bought", () => {
    const link = dialog(gated).getByText("View plans").closest("a");

    expect(link?.getAttribute("href")).toBe(
      routes.app.profile.org("acme").billing,
    );
  });

  it("shows no notice to an organization with seats", () => {
    expect(dialog(null).queryByText(/Enrolling learners needs/)).toBeNull();
  });
});

describe("SE4 — a lapsed subscription is not an upsell", () => {
  it("says the subscription lapsed instead of naming a tier to buy", () => {
    const text = dialog({ ...gated, reason: "lapsed" }).getByRole(
      "dialog",
    ).textContent;

    expect(text).toContain("This subscription has lapsed");
    expect(text).not.toContain("Starter");
  });

  it("still disables Enroll and still points at the settings page", () => {
    const queries = dialog({ ...gated, reason: "lapsed" });

    expect(enrollButton(queries)?.disabled).toBe(true);
    expect(queries.getByText("View plans").closest("a")).not.toBeNull();
  });
});

describe("SE2 — the list stays live under the lock", () => {
  it("still shows who would be enrolled", () => {
    expect(dialog(gated).queryByText("Ada")).not.toBeNull();
  });

  it("still offers the search and due-date inputs", () => {
    const queries = dialog(gated);

    expect(queries.queryByPlaceholderText("Search…")).not.toBeNull();
    expect(queries.queryByText("Due date")).not.toBeNull();
  });
});

describe("SE3 — the plan is asked about only while the dialog is open", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInfiniteQuery.mockReturnValue({
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      fetchNextPage: vi.fn(),
    });
    useMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useQuery.mockReturnValue({ data: undefined });
  });

  const mount = (open: boolean) =>
    render(
      <CourseEnrollMembersDialog
        courseId="c-1"
        orgSlug="acme"
        open={open}
        onOpenChange={() => {}}
        t={t}
      />,
    );

  it("asks nothing while closed", () => {
    mount(false);

    expect(useQuery).toHaveBeenCalledWith(
      { orgSlug: "acme" },
      { enabled: false },
    );
  });

  it("asks once opened", () => {
    mount(true);

    expect(useQuery).toHaveBeenCalledWith(
      { orgSlug: "acme" },
      { enabled: true },
    );
  });

  it("accuses nobody while the plan is unanswered (SB5's rule)", () => {
    useQuery.mockReturnValue({ data: undefined });

    const { baseElement } = mount(true);

    expect(
      within(baseElement).queryByText(/Enrolling learners needs/),
    ).toBeNull();
  });

  it("shows the notice once the plan answers with a refusal", () => {
    useQuery.mockReturnValue({ data: { enroll: gated } });

    const { baseElement } = mount(true);

    expect(
      within(baseElement).queryByText(/Enrolling learners needs/),
    ).not.toBeNull();
  });
});
