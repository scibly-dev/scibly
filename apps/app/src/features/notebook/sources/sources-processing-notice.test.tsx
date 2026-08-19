import type { NotebookTranslations } from "../i18n/notebook.types";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

const query = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@/shared/api/trpc/client", () => ({
  api: { notebook: { source: { list: { useQuery: query.useQuery } } } },
}));

const { SourcesProcessingNotice } = await import("./sources-processing-notice");

const t = {
  sources: {
    processingNoticeOne: "1 source is still processing.",
    processingNoticeMany: "{count} sources are still processing.",
    processingNoticeDismiss: "Dismiss",
  },
} as NotebookTranslations;

// A fresh element every time: React skips re-rendering one it is handed twice.
const notice = () => <SourcesProcessingNotice notebookId="nb-1" t={t} />;

function withSources(...statuses: string[]) {
  query.useQuery.mockReturnValue({
    data: statuses.map((status, index) => ({ id: `src-${index}`, status })),
  });
}

function withSourceIds(...ids: string[]) {
  query.useQuery.mockReturnValue({
    data: ids.map((id) => ({ id, status: SOURCE_STATUS.PENDING })),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  query.useQuery.mockReturnValue({ data: [] });
});

describe("what the notice says", () => {
  it("stays quiet while every source is one the agent can read", () => {
    withSources(SOURCE_STATUS.READY, SOURCE_STATUS.FAILED);
    render(notice());

    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each([
    { case: "waiting to be ingested", status: SOURCE_STATUS.PENDING },
    { case: "being ingested", status: SOURCE_STATUS.PROCESSING },
  ])("counts a source $case", ({ status }) => {
    withSources(status, SOURCE_STATUS.READY);
    render(notice());

    expect(screen.getByRole("status").textContent).toContain(
      "1 source is still processing.",
    );
  });

  it("counts the sources in flight, not the notebook's", () => {
    withSources(
      SOURCE_STATUS.PENDING,
      SOURCE_STATUS.PROCESSING,
      SOURCE_STATUS.READY,
    );
    render(notice());

    expect(screen.getByRole("status").textContent).toContain(
      "2 sources are still processing.",
    );
  });
});

describe("dismissing it", () => {
  it("takes the notice away for the sources it was shown about", () => {
    withSources(SOURCE_STATUS.PENDING);
    render(notice());

    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not silence the next upload", () => {
    withSources(SOURCE_STATUS.PENDING);
    const { rerender } = render(notice());
    fireEvent.click(screen.getByLabelText("Dismiss"));

    withSources(SOURCE_STATUS.PENDING, SOURCE_STATUS.PROCESSING);
    rerender(notice());

    expect(screen.getByRole("status").textContent).toContain(
      "2 sources are still processing.",
    );
  });

  it("says so again when one finishes and another arrives", () => {
    withSourceIds("first");
    const { rerender } = render(notice());
    fireEvent.click(screen.getByLabelText("Dismiss"));

    withSourceIds("second");
    rerender(notice());

    expect(screen.getByRole("status").textContent).toContain(
      "1 source is still processing.",
    );
  });

  it("stays away while the sources it was shown about are still in flight", () => {
    withSourceIds("first", "second");
    const { rerender } = render(notice());
    fireEvent.click(screen.getByLabelText("Dismiss"));

    withSourceIds("first");
    rerender(notice());

    expect(screen.queryByRole("status")).toBeNull();
  });
});
