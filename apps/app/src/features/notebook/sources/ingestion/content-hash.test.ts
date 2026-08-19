import { describe, expect, it } from "vitest";

import { computeContentHash } from "./content-hash";

const BASE = "The mitochondrion is the powerhouse of the cell.";

describe("SI2: what counts as a change", () => {
  it.each([
    {
      name: "a line rewrapped by a re-export",
      variant: "The mitochondrion is the powerhouse\nof the cell.",
    },
    {
      name: "a run of spaces collapsed",
      variant: "The  mitochondrion   is the powerhouse of the cell.",
    },
    {
      name: "leading and trailing whitespace",
      variant: "\n  The mitochondrion is the powerhouse of the cell.  \n",
    },
    {
      name: "a tab swapped for a space",
      variant: "The\tmitochondrion is the powerhouse of the cell.",
    },
    {
      name: "a paragraph break widened",
      variant: "The mitochondrion is the powerhouse\n\n\nof the cell.",
    },
  ])("treats $name as no change at all", ({ variant }) => {
    expect(computeContentHash(variant)).toBe(computeContentHash(BASE));
  });

  it.each([
    {
      name: "a word replaced",
      variant: "The mitochondrion is the powerhouse of the plant.",
    },
    {
      name: "a sentence removed",
      variant: "The mitochondrion is.",
    },
    {
      name: "words reordered",
      variant: "The powerhouse of the cell is the mitochondrion.",
    },
    {
      name: "a word boundary introduced where there was none",

      variant: "The mitochondrion is the power house of the cell.",
    },
  ])("treats $name as a change", ({ variant }) => {
    expect(computeContentHash(variant)).not.toBe(computeContentHash(BASE));
  });

  it("normalises before hashing rather than inheriting it from the caller", () => {
    expect(computeContentHash("  a\n\n b \t c  ")).toBe(
      computeContentHash("a b c"),
    );
  });
});
