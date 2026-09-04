import { describe, expect, it } from "vitest";

import { checkPracticeScene } from "./check-practice-scene";

const SOLUTION = { order: { value: "a > b", points: 10 } };

const GOOD_HTML = `
  <div id="app"></div>
  <script>
    document.getElementById("app").onclick = () =>
      window.scibly.submit({ order: "a > b" });
    window.scibly.onGraded((grade) => console.log(grade.fields.order));
    window.__sciblySelfTest = () => ({ order: "a > b" });
  </script>
`;

describe("CPS1: checkPracticeScene", () => {
  it("passes an app that submits, reports and self-tests the field the key grades", () => {
    expect(
      checkPracticeScene({
        practiceHtml: GOOD_HTML,
        practiceSolution: SOLUTION,
      }),
    ).toEqual([]);
  });

  it.each([
    ["no html at all", "", "no app html"],
    [
      "an app nobody can self-test",
      GOOD_HTML.replace("window.__sciblySelfTest =", "const hook ="),
      "__sciblySelfTest",
    ],
    [
      "an app that never submits",
      GOOD_HTML.replace("window.scibly.submit(", "noop("),
      "submit(work)",
    ],
    [
      "an app that never shows the grade",
      GOOD_HTML.replace("window.scibly.onGraded(", "noop("),
      "onGraded()",
    ],
    [
      "a key field the app never mentions",
      GOOD_HTML.replaceAll("order", "sequence"),
      '"order"',
    ],
  ])("refuses %s", (_case, html, expected) => {
    const problems = checkPracticeScene({
      practiceHtml: html,
      practiceSolution: SOLUTION,
    });
    expect(problems.join(" ")).toContain(expected);
  });

  it("asks nothing of an exploratory scene — it submits nothing to check", () => {
    expect(
      checkPracticeScene({
        practiceHtml: "<p>play</p>",
        practiceSolution: null,
      }),
    ).toEqual([]);
  });
});
