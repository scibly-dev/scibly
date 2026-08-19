import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Source = RouterOutputs["notebook"]["source"]["list"][number];

const inFlight = vi.hoisted(() => ({ current: "" }));

vi.mock("@/shared/api/trpc/client", () => {
  const endpoint = (key: string) => ({
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: inFlight.current === key,
      variables: { sourceId: "src-1" },
    }),
  });
  return {
    api: {
      notebook: {
        source: {
          replaceUpload: endpoint("replace"),
          confirmReplaceUpload: endpoint("confirmReplace"),
          retryIngest: endpoint("retry"),
          getDownloadUrl: endpoint("download"),
          delete: endpoint("delete"),
        },
      },
      integration: { resyncSource: endpoint("resync") },
    },
  };
});

const { SourceListItem } = await import("./source-list-item");

const t = {
  statusPending: "Pending",
  statusProcessing: "Processing",
  statusReady: "Ready",
  statusFailed: "Failed",
  deleteConfirmDescription: "Delete {{name}}?",
} as NotebookTranslations["sources"];

const source = {
  id: "src-1",
  name: "Zellbiologie.pdf",
  type: "PDF",
  status: "READY",
  url: "https://example.invalid/zellbiologie.pdf",
  fileSize: 1024,
  externalId: null,
  externalUrl: null,
  error: null,
  warning: null,
  retryable: false,
} as Source;

const row = (overrides: Partial<Source> = {}) =>
  render(
    <SourceListItem
      item={{ ...source, ...overrides }}
      orgSlug="acme"
      t={t}
      onDeleted={vi.fn()}
    />,
  );

beforeEach(() => {
  inFlight.current = "";
});

describe("what the badge says while the client is waiting", () => {
  it.each([
    { trigger: "the file is being replaced", pending: "confirmReplace" },
    { trigger: "a failed ingest is being retried", pending: "retry" },
    { trigger: "an integration page is being re-synced", pending: "resync" },
  ])("reads processing while $trigger", ({ pending }) => {
    inFlight.current = pending;
    row({ status: "READY" });

    expect(screen.getByText("Processing")).toBeTruthy();
    expect(screen.queryByText("Ready")).toBeNull();
  });

  it("reads the server's status when the row set nothing off", () => {
    row({ status: "READY" });

    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("does not claim a download is processing", () => {
    inFlight.current = "download";
    row({ status: "READY" });

    expect(screen.getByText("Ready")).toBeTruthy();
  });
});
