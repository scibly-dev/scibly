import { describe, expect, it } from "vitest";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

import { sourcesIngestionPollInterval } from "./use-notebook-sources";

describe("when the sources list re-asks", () => {
  it.each([
    { case: "waiting to be ingested", status: SOURCE_STATUS.PENDING },
    { case: "being ingested", status: SOURCE_STATUS.PROCESSING },
  ])("polls while a source is $case", ({ status }) => {
    expect(
      sourcesIngestionPollInterval([{ status }, { status: "READY" }]),
    ).toBeGreaterThan(0);
  });

  it.each([
    { case: "settled", sources: [{ status: "READY" }, { status: "FAILED" }] },
    { case: "empty", sources: [] },
    { case: "not loaded yet", sources: undefined },
  ])("stays quiet when the list is $case", ({ sources }) => {
    expect(sourcesIngestionPollInterval(sources)).toBe(false);
  });
});
