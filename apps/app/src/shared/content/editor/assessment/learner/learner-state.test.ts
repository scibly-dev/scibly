import { describe, expect, it } from "vitest";

import { stripLearnerStateFromQuestionBlocks } from "./learner-state";

/** Fixtures go through real DOM APIs, so the tests exercise actual browser escaping. */

const AUTHORED = {
  optional: false,
  questionData: { answer: "Paris", caseSensitive: false },
  maxPoints: 4,
  sp: 10,
};

const LEARNER_STATE = { userAnswers: "Lisbon", achievedPoints: 3 };

function agentAuthored(data: unknown, type = "custom-input-field"): string {
  return `<div data-type="${type}" questionblock-data='${JSON.stringify(data)}'></div>`;
}

function editorSerialised(data: unknown, type = "custom-input-field"): string {
  const element = document.createElement("div");
  element.setAttribute("data-type", type);
  element.setAttribute("questionblock-data", JSON.stringify(data));
  return element.outerHTML;
}

function blockData(html: string): { questionData?: unknown }[] {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return [...parsed.querySelectorAll("[questionblock-data]")].map(
    (element) =>
      JSON.parse(element.getAttribute("questionblock-data") ?? "") as {
        questionData?: unknown;
      },
  );
}

const WRITINGS = [
  { name: "the agent authored it", write: agentAuthored },
  { name: "the editor serialised it", write: editorSerialised },
] as const;

describe("an author's document keeps only what an author may set", () => {
  it.each(WRITINGS)(
    "keeps optional, questionData, maxPoints and sp when $name",
    ({ write }) => {
      const [data] = blockData(
        stripLearnerStateFromQuestionBlocks(write(AUTHORED)),
      );

      expect(data).toEqual(AUTHORED);
    },
  );
});

describe("learner state never survives into an author's document", () => {
  it.each(WRITINGS)(
    "drops a recorded answer and an achieved score when $name",
    ({ write }) => {
      const [data] = blockData(
        stripLearnerStateFromQuestionBlocks(
          write({ ...AUTHORED, ...LEARNER_STATE }),
        ),
      );

      expect(data).toEqual(AUTHORED);
    },
  );
});

describe("a field the block type does not define is dropped", () => {
  it.each(WRITINGS)("drops an undeclared field when $name", ({ write }) => {
    const [data] = blockData(
      stripLearnerStateFromQuestionBlocks(
        write({ ...AUTHORED, hintForTheAnswer: "Paris", internalNote: 7 }),
      ),
    );

    expect(data).toEqual(AUTHORED);
  });
});

describe("an absent field is not invented", () => {
  it.each(WRITINGS)(
    "leaves maxPoints absent rather than materialising it when $name",
    ({ write }) => {
      const { maxPoints: _omitted, ...withoutMaxPoints } = AUTHORED;
      const [data] = blockData(
        stripLearnerStateFromQuestionBlocks(write(withoutMaxPoints)),
      );

      expect(Object.keys(data)).not.toContain("maxPoints");
      expect(data).toEqual(withoutMaxPoints);
    },
  );
});

describe("questionData passes through whole", () => {
  it.each(WRITINGS)("keeps the solution when $name", ({ write }) => {
    const solution = {
      segments: [
        { type: "text", id: "s1", content: "The " },
        { type: "gap", id: "g1", correctItemId: "i2" },
      ],
      items: [
        { id: "i1", label: "moon" },
        { id: "i2", label: "sun" },
      ],
    };
    const [data] = blockData(
      stripLearnerStateFromQuestionBlocks(
        write(
          { ...AUTHORED, questionData: solution, ...LEARNER_STATE },
          "custom-cloze-text",
        ),
      ),
    );

    expect(data.questionData).toEqual(solution);
  });
});

describe("every question block is treated", () => {
  it.each(WRITINGS)(
    "strips the third block as well as the first when $name",
    ({ write }) => {
      const html = [
        write({ ...AUTHORED, ...LEARNER_STATE }),
        "<p>Between the questions.</p>",
        write({ ...AUTHORED, ...LEARNER_STATE }, "custom-multiple-choice"),
        write({ ...AUTHORED, ...LEARNER_STATE }, "custom-free-form-input"),
      ].join("");

      const blocks = blockData(stripLearnerStateFromQuestionBlocks(html));

      expect(blocks).toHaveLength(3);
      expect(blocks).toEqual([AUTHORED, AUTHORED, AUTHORED]);
    },
  );
});

describe("nothing but question block data is rewritten", () => {
  it("returns a document with no question blocks byte-identical", () => {
    const html =
      "<h2>Phishing</h2><p>Read the <em>whole</em> message.</p>" +
      '<img data-media-attributes=\'{"src":"https://example.com/a.png","width":"400"}\' />' +
      "<blockquote><p>Slow down.</p></blockquote>";

    expect(stripLearnerStateFromQuestionBlocks(html)).toBe(html);
  });

  it.each(WRITINGS)(
    "leaves the surrounding scene untouched when $name",
    ({ write }) => {
      const before = "<h2>Phishing</h2><p>Read the <em>whole</em> message.</p>";
      const after =
        '<img data-media-attributes=\'{"src":"https://example.com/a.png"}\' />';

      const output = stripLearnerStateFromQuestionBlocks(
        `${before}${write({ ...AUTHORED, ...LEARNER_STATE })}${after}`,
      );

      expect(output.startsWith(before)).toBe(true);
      expect(output.endsWith(after)).toBe(true);
    },
  );
});

describe("both writings of the attribute are read", () => {
  it("strips a block the agent authored — single-quoted, unescaped", () => {
    const html = agentAuthored({ ...AUTHORED, ...LEARNER_STATE });
    expect(html).toContain(`questionblock-data='{"optional"`);

    expect(blockData(stripLearnerStateFromQuestionBlocks(html))).toEqual([
      AUTHORED,
    ]);
  });

  it("strips a block the editor serialised — double-quoted, escaped", () => {
    const html = editorSerialised({ ...AUTHORED, ...LEARNER_STATE });
    expect(html).toContain("&quot;optional&quot;");

    expect(blockData(stripLearnerStateFromQuestionBlocks(html))).toEqual([
      AUTHORED,
    ]);
  });
});

describe("a block that cannot be read stops the insertion", () => {
  it.each([
    { name: "truncated JSON", raw: `{"optional":false,"questionData":` },
    { name: "not JSON at all", raw: "the answer is Paris" },
    { name: "a JSON array where an object belongs", raw: "[1,2,3]" },
    { name: "a bare JSON string", raw: '"optional"' },
    { name: "empty", raw: "" },
  ])("$name is rejected rather than passed through", ({ raw }) => {
    const html = `<div data-type="custom-input-field" questionblock-data='${raw}'></div>`;

    expect(() => stripLearnerStateFromQuestionBlocks(html)).toThrow();
  });

  it("rejects the whole document, not just the bad block", () => {
    const html = [
      agentAuthored({ ...AUTHORED, ...LEARNER_STATE }),
      `<div data-type="custom-multiple-choice" questionblock-data='{"optional":'></div>`,
    ].join("");

    expect(() => stripLearnerStateFromQuestionBlocks(html)).toThrow();
  });
});

describe("the rejection is something the agent can act on", () => {
  it("names the attribute and quotes what it could not read", () => {
    const html = `<div data-type="custom-input-field" questionblock-data='{"optional":false,"oops'></div>`;

    expect(() => stripLearnerStateFromQuestionBlocks(html)).toThrow(
      /questionblock-data/,
    );
    expect(() => stripLearnerStateFromQuestionBlocks(html)).toThrow(/oops/);
  });
});
