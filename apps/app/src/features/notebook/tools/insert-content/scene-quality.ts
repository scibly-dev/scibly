import {
  analyzeSceneHtml,
  type SceneHtmlAnalysis,
} from "./scene-html-analysis";

type SceneQualityRule = (analysis: SceneHtmlAnalysis) => string | undefined;

const SCENE_QUALITY_RULES: SceneQualityRule[] = [
  ({ headingCount }) =>
    headingCount > 0
      ? `Scene contains ${headingCount} heading(s). Duolingo-style scenes don't use headings: the scene IS the task, not a chapter. Put the prompt as a short plain sentence, or let the guide character frame it.`
      : undefined,

  ({ interactionCount, mediaCount }) =>
    interactionCount + mediaCount > 1
      ? `Scene has ${interactionCount} interaction and ${mediaCount} media blocks; the limit is one interaction OR one media block per scene. Split the extras into their own scenes.`
      : undefined,

  ({ interactionCount, mediaCount, guideCount }) =>
    interactionCount === 0 && mediaCount === 0 && guideCount === 0
      ? "Scene is plain text only (headings and paragraphs, no interaction, media, or guide character). Wrap the message in a guide-character block, add an image, or turn the exposition into an interaction."
      : undefined,

  ({ sentenceCount, wordCount }) =>
    sentenceCount > 4 || wordCount > 90
      ? `Scene body has ~${sentenceCount} sentences / ${wordCount} words of prose; setup text is at most 1-2 short sentences (a guide-character beat may be slightly longer). Cut the text or split the scene into more single-task scenes.`
      : undefined,

  ({ listItemCount }) =>
    listItemCount > 3
      ? `Scene has a list with ${listItemCount} items; the limit is 3. Longer lists are reference dumps — split them or convert to flashcards, cloze, or drag-and-drop.`
      : undefined,

  ({ hasEmDash }) =>
    hasEmDash
      ? "Scene copy contains an em/en dash. Replace with a period, comma, or 'and'/'but'."
      : undefined,
];

function validateSceneQuality(html: string): string[] {
  const analysis = analyzeSceneHtml(html);
  return SCENE_QUALITY_RULES.flatMap((rule) => {
    const warning = rule(analysis);
    return warning ? [warning] : [];
  });
}

export function buildQualityWarning(html: string): string | undefined {
  const warnings = validateSceneQuality(html);
  if (warnings.length === 0) return undefined;
  return `Scene quality check (fix before moving on):\n- ${warnings.join("\n- ")}`;
}
