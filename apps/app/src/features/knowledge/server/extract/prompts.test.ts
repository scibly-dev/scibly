import type { BundleContent } from "../collect/bundle";

import { describe, expect, it } from "vitest";

import { pickDigestComments } from "./prompts";
import { FUNNEL } from "./thresholds";

const comment = (author: string, body: string) => ({
  author,
  body,
  url: `https://github.com/acme/api/pull/7#${author}-${body.length}`,
  diffHunk: null,
});

const content = (over: Partial<BundleContent>): BundleContent => ({
  title: "Retry the webhook",
  body: "",
  url: "https://github.com/acme/api/pull/7",
  labels: [],
  filePaths: [],
  linkedIssues: [],
  comments: [],
  threads: [],
  ...over,
});

/** Long enough to clear the floor, short enough that several still fit. */
const long = (word: string) => word.repeat(30);

describe("pickDigestComments", () => {
  it("takes the whole conversation when the whole conversation fits", () => {
    const picked = pickDigestComments(
      content({
        comments: [comment("ada", "lgtm"), comment("grace", "ship it")],
        threads: [
          {
            path: "src/a.ts",
            isResolved: true,
            comments: [comment("ada", "?")],
          },
        ],
      }),
    );

    expect(picked).toHaveLength(3);
    expect(picked.join("\n")).toContain("lgtm");
  });

  it("reaches for the threads several people spoke in first", () => {
    const picked = pickDigestComments(
      content({
        comments: Array.from({ length: 40 }, (_, at) =>
          comment(`author-${at}`, long(`monologue${at} `)),
        ),
        threads: [
          {
            path: "src/a.ts",
            isResolved: false,
            comments: [
              comment("ada", "objection: this retries forever"),
              comment("grace", "middle"),
              comment("ada", "settled: cap it at five"),
            ],
          },
        ],
      }),
    );

    const joined = picked.join("\n");
    expect(joined.length).toBeLessThanOrEqual(FUNNEL.triage.commentBudget);
    expect(joined).toContain("objection");
    expect(joined).toContain("settled");
    // The opening and the close, never the middle of a thread.
    expect(joined).not.toContain("middle");
  });

  it("gives every voice a turn before anyone a second", () => {
    const picked = pickDigestComments(
      content({
        comments: [
          comment("ada", long("first ")),
          comment("ada", long("second ")),
          comment("grace", long("only ")),
          comment("ada", "+1"),
        ],
        // One voice, so the thread never enters the queue — it is here only to
        // push the conversation over budget, so selection actually runs.
        threads: [
          {
            path: null,
            isResolved: false,
            comments: Array.from({ length: 20 }, () =>
              comment("solo", long("filler ")),
            ),
          },
        ],
      }),
    );

    const joined = picked.join("\n");
    expect(joined.indexOf("only")).toBeLessThan(joined.indexOf("second"));
    // A "+1" is an acknowledgement, not an argument.
    expect(joined).not.toContain("+1");
  });
});
