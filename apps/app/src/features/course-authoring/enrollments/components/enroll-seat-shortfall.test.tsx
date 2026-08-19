import type { CoursesTranslations } from "@/features/course-authoring/contracts";

import { routes } from "@scibly/routes";
import { act, fireEvent, render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Registers the doubles below, and must run before the dialog is imported.
// A side-effect import is the one form the import sorter will not move.
import "./testing";

import { CourseEnrollMembersDialog } from "./course-enroll-members-dialog";
import { member, useInfiniteQuery, useMutation, useQuery } from "./testing";

const mutate = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));

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
      toastError: "Something went wrong.",
      seatShortfallTitle: "{{count}} more learner seats are needed",
      seatShortfallDescription: "Buy {{count}} seats, then try again.",
      seatShortfallLink: "Add {{count}} seats",
    },
  },
} as CoursesTranslations;

const seatRefusal = (shortfall: unknown) => ({
  message: "Enrolling these people needs more learner seats.",
  data: {
    applicationCode: "entitlement.seats_exhausted",
    details: { shortfall, remainingSeats: 0 },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  useInfiniteQuery.mockReturnValue({
    data: { pages: [{ items: [member], nextCursor: undefined }] },
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    fetchNextPage: vi.fn(),
  });
  useMutation.mockReturnValue({ mutate, isPending: false });
  useQuery.mockReturnValue({ data: { enroll: { allowed: true } } });
});

function dialog() {
  const { baseElement } = render(
    <CourseEnrollMembersDialog
      courseId="c-1"
      orgSlug="acme"
      open
      onOpenChange={() => {}}
      t={t}
    />,
  );
  const queries = within(baseElement);
  return {
    queries,
    select: () => fireEvent.click(queries.getByText("Ada")),
    enroll: () =>
      fireEvent.click(
        queries
          .getAllByRole("button")
          .find((button) => button.textContent?.startsWith("Enroll"))!,
      ),
  };
}

const answerWith = (error: unknown) =>
  act(() => {
    useMutation.mock.calls.at(-1)?.[0].onError(error);
  });

describe("LU4 — the refusal stays beside the people it refused", () => {
  it("shows the shortfall in the dialog rather than a toast", () => {
    const { queries, select } = dialog();
    select();

    answerWith(seatRefusal(3));

    expect(
      queries.queryByText("3 more learner seats are needed"),
    ).not.toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("keeps the selection, so a retry needs no re-picking", () => {
    const { queries, select } = dialog();
    select();

    answerWith(seatRefusal(3));

    expect(
      queries
        .getAllByRole("button")
        .some((button) => button.textContent === "Enroll (1)"),
    ).toBe(true);
  });

  it("leaves any other refusal the toast it always had", () => {
    dialog().select();

    answerWith({ message: "Boom", data: { applicationCode: "internal" } });

    expect(toastError).toHaveBeenCalledWith("Boom");
  });

  it("does not read a seat count off another cap's refusal", () => {
    const { queries } = dialog();

    answerWith({
      message: "This notebook has room for 3 fewer sources.",
      data: {
        applicationCode: "entitlement.sources_exhausted",
        details: { shortfall: 3, remainingSources: 0 },
      },
    });

    expect(queries.queryByText(/more learner seats are needed/)).toBeNull();
    expect(toastError).toHaveBeenCalled();
  });

  it("falls back to the plain refusal when the count is missing", () => {
    const { queries } = dialog();

    answerWith(seatRefusal("many"));

    expect(queries.queryByText(/more learner seats are needed/)).toBeNull();
    expect(toastError).toHaveBeenCalled();
  });
});

describe("LU3/LU6 — the server's count rides into the purchase", () => {
  it("links to the seats card carrying the shortfall", () => {
    const { queries } = dialog();

    answerWith(seatRefusal(7));

    expect(
      queries.getByText("Add 7 seats").closest("a")?.getAttribute("href"),
    ).toBe(`${routes.app.profile.org("acme").billing}?seats=7#seats`);
  });

  it("shows the count everywhere it is named, never the placeholder", () => {
    const { queries } = dialog();

    answerWith(seatRefusal(7));

    const text = queries.getByRole("dialog").textContent ?? "";
    expect(text).toContain("Buy 7 seats, then try again.");
    expect(text).not.toContain("{{count}}");
  });
});

describe("a shortfall counted against a different selection is not shown", () => {
  it("clears once the selection changes", () => {
    const { queries, select } = dialog();
    select();
    answerWith(seatRefusal(3));

    select();

    expect(queries.queryByText("3 more learner seats are needed")).toBeNull();
  });

  it("clears when the enrollment is attempted again", () => {
    const { queries, select, enroll } = dialog();
    select();
    answerWith(seatRefusal(3));

    enroll();

    expect(queries.queryByText("3 more learner seats are needed")).toBeNull();
    expect(mutate).toHaveBeenCalled();
  });
});
