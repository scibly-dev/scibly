// ponytail: string checks, not a parser — an app with all four markers that still
// throws at runtime gets through; upgrade path is a headless Chromium run.
export function checkPracticeScene(scene: {
  practiceHtml?: string | null;
  practiceSolution?: unknown;
}): string[] {
  const html = scene.practiceHtml;
  if (!html?.trim()) return ["it has no app html yet"];

  const fieldIds = Object.keys(scene.practiceSolution ?? {});
  // An exploratory scene submits nothing and grades nothing: no claim to check.
  if (fieldIds.length === 0) return [];

  const problems: string[] = [];
  if (!/__sciblySelfTest\s*=/.test(html)) {
    problems.push("the app never assigns window.__sciblySelfTest");
  }
  if (!/\.submit\s*\(/.test(html)) {
    problems.push("the app never calls window.scibly.submit(work)");
  }
  if (!/\.onGraded\s*\(/.test(html)) {
    problems.push(
      "the app never calls window.scibly.onGraded(), so the learner never finds out what they got wrong",
    );
  }
  const unmentioned = fieldIds.filter((id) => !html.includes(id));
  if (unmentioned.length > 0) {
    problems.push(
      `the app never mentions the solution field(s) ${unmentioned
        .map((id) => `"${id}"`)
        .join(", ")} — submit(work) cannot be sending them`,
    );
  }
  return problems;
}
