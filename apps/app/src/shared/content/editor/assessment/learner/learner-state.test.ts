import { describe, expect, it } from "vitest";

import { stripLearnerStateFromQuestionBlocks } from "./learner-state";

/**
 * Fixtures go through real DOM APIs for both attribute encodings (the agent's
 * raw single-quoted form and `editor.getHTML()`'s escaped form) rather than
 * hand-written strings, so the tests exercise actual browser escaping instead
 * of assumptions about it.
 */

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

function parse(html: string): HTMLElement {
  return new DOMParser().parseFromString(html, "text/html").body;
}

function strip(html: string): HTMLElement {
  const body = parse(html);
  stripLearnerStateFromQuestionBlocks(body);
  return body;
}

function blockData(body: HTMLElement): { questionData?: unknown }[] {
  return [...body.querySelectorAll("[questionblock-data]")].map(
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
      const [data] = blockData(strip(write(AUTHORED)));

      expect(data).toEqual(AUTHORED);
    },
  );
});

describe("learner state never survives into an author's document", () => {
  it.each(WRITINGS)(
    "drops a recorded answer and an achieved score when $name",
    ({ write }) => {
      const [data] = blockData(strip(write({ ...AUTHORED, ...LEARNER_STATE })));

      expect(data).toEqual(AUTHORED);
    },
  );
});

describe("a field the block type does not define is dropped", () => {
  it.each(WRITINGS)("drops an undeclared field when $name", ({ write }) => {
    const [data] = blockData(
      strip(write({ ...AUTHORED, hintForTheAnswer: "Paris", internalNote: 7 })),
    );

    expect(data).toEqual(AUTHORED);
  });
});

describe("an absent field is not invented", () => {
  it.each(WRITINGS)(
    "leaves maxPoints absent rather than materialising it when $name",
    ({ write }) => {
      const { maxPoints: _omitted, ...withoutMaxPoints } = AUTHORED;
      const [data] = blockData(strip(write(withoutMaxPoints)));

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
      strip(
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

      const blocks = blockData(strip(html));

      expect(blocks).toHaveLength(3);
      expect(blocks).toEqual([AUTHORED, AUTHORED, AUTHORED]);
    },
  );
});

describe("nothing but question block data is rewritten", () => {
  it("leaves a document with no question blocks alone", () => {
    const html =
      "<h2>Phishing</h2><p>Read the <em>whole</em> message.</p>" +
      '<img data-media-attributes=\'{"src":"https://example.com/a.png","width":"400"}\' />' +
      "<blockquote><p>Slow down.</p></blockquote>";

    expect(strip(html).innerHTML).toBe(parse(html).innerHTML);
  });

  it.each(WRITINGS)(
    "leaves the surrounding scene untouched when $name",
    ({ write }) => {
      const before = "<h2>Phishing</h2><p>Read the <em>whole</em> message.</p>";
      const after =
        '<img data-media-attributes=\'{"src":"https://example.com/a.png"}\' />';

      const html = `${before}${write({ ...AUTHORED, ...LEARNER_STATE })}${after}`;
      const body = strip(html);

      expect(body.innerHTML.startsWith(parse(before).innerHTML)).toBe(true);
      expect(body.innerHTML.endsWith(parse(after).innerHTML)).toBe(true);
    },
  );

  it("leaves prose that merely mentions the attribute as prose", () => {
    const html =
      "<p>Set questionblock-data=\"{'sp':10}\" on the block.</p>" +
      agentAuthored({ ...AUTHORED, ...LEARNER_STATE });

    const body = strip(html);

    expect(body.querySelector("p")?.textContent).toBe(
      "Set questionblock-data=\"{'sp':10}\" on the block.",
    );
    expect(blockData(body)).toEqual([AUTHORED]);
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

    expect(() => strip(html)).toThrow();
  });

  it("rejects the whole document, not just the bad block", () => {
    const html = [
      agentAuthored({ ...AUTHORED, ...LEARNER_STATE }),
      `<div data-type="custom-multiple-choice" questionblock-data='{"optional":'></div>`,
    ].join("");

    expect(() => strip(html)).toThrow();
  });

  it("an apostrophe inside the value is read, not treated as the end of it", () => {
    const data = {
      ...AUTHORED,
      questionData: { answer: "the moon's phase" },
      ...LEARNER_STATE,
    };
    const html = editorSerialised(data);

    expect(blockData(strip(html))).toEqual([
      { ...AUTHORED, questionData: { answer: "the moon's phase" } },
    ]);
  });
});

describe("the rejection is something the agent can act on", () => {
  it("names the attribute and quotes what it could not read", () => {
    const html = `<div data-type="custom-input-field" questionblock-data='{"optional":false,"oops'></div>`;

    expect(() => strip(html)).toThrow(/questionblock-data/);
    expect(() => strip(html)).toThrow(/oops/);
  });
});
