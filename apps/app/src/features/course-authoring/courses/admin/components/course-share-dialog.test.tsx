import type { CoursesTranslations } from "@/features/course-authoring/contracts";

import { fireEvent, render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseShareDialog } from "./course-share-dialog";

const mutate = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({ course: { getById: { invalidate: vi.fn() } } }),
    course: {
      update: { useMutation: () => ({ mutate, isPending: false }) },
    },
  },
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ lang: "en" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const t = {
  detail: {
    share: {
      title: "Share course",
      description: "Give people outside your organization a way in.",
      publicAccessLabel: "Public access",
      publicAccessDescription: "Let anyone open this course with a link.",
      toastEnabled: "Public access is on.",
      toastDisabled: "Public access is off.",
      toastFailed: "Could not change public access.",
      offTitle: "Public access is off",
      offDescription: "Turn it on to get a link and a snippet.",
      tabLink: "Link",
      tabEmbed: "Embed",
      linkLabel: "Public link",
      linkHint: "Anyone with this link can open the course.",
      embedLanguage: "Language",
      embedHeight: "Height",
      embedResizeLabel: "Resize to fit content",
      embedResizeDescription: "Adds a small script.",
      embedCodeLabel: "Embed code",
      embedHint: "Paste both tags into your page.",
      copy: "Copy",
      copied: "Copied",
    },
  },
} as CoursesTranslations;

function shareDialog(allowAnonymous: boolean) {
  const { baseElement } = render(
    <CourseShareDialog
      allowAnonymous={allowAnonymous}
      course={{ id: "c-1", title: "Fire safety" }}
      onOpenChange={() => {}}
      open
      t={t}
    />,
  );
  return within(baseElement);
}

const accessSwitch = (queries: ReturnType<typeof shareDialog>) =>
  queries.getByRole("switch", { name: "Public access" });

beforeEach(() => vi.clearAllMocks());

describe("SS1 — nothing is handed out until sharing is on", () => {
  it("offers no link and no snippet while it is off", () => {
    const queries = shareDialog(false);

    expect(queries.queryByText("Public link")).toBeNull();
    expect(queries.queryByText("Embed")).toBeNull();
    expect(queries.queryByText("Public access is off")).not.toBeNull();
  });

  it("shows a locale-free link once it is on", () => {
    const queries = shareDialog(true);

    expect(queries.queryByText("Public link")).not.toBeNull();
    expect(
      queries.queryByDisplayValue(/^https?:\/\/[^/]+\/public\/courses\/c-1$/),
    ).not.toBeNull();
  });
});

describe("SS2 — the switch is the save", () => {
  it("turns public access on without any further confirmation", () => {
    fireEvent.click(accessSwitch(shareDialog(false)));

    expect(mutate).toHaveBeenCalledWith({
      courseId: "c-1",
      allowAnonymous: true,
    });
  });

  it("turns it off the same way", () => {
    fireEvent.click(accessSwitch(shareDialog(true)));

    expect(mutate).toHaveBeenCalledWith({
      courseId: "c-1",
      allowAnonymous: false,
    });
  });

  it("has no Save or Cancel to press", () => {
    const labels = shareDialog(true)
      .getAllByRole("button")
      .map((button) => button.textContent);

    expect(labels).not.toContain("Save");
    expect(labels).not.toContain("Cancel");
  });
});

describe("SS3 — the surface follows the switch, not the refetch", () => {
  it("hands out the link as soon as it is switched on", () => {
    const queries = shareDialog(false);

    fireEvent.click(accessSwitch(queries));

    expect(queries.queryByText("Public link")).not.toBeNull();
  });
});
