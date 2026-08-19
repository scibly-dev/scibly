import { GUIDE_CHARACTER_NODE_NAME } from "@/shared/content/editor/blocks/guide-character/schema";
import {
  SCENE_INTERACTION_DATA_TYPES,
  SCENE_MEDIA_HTML_TAGS,
} from "@/shared/content/editor/blocks/registry/scene-metadata";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length;
}

function countDataType(html: string, dataType: string): number {
  return countMatches(
    html,
    new RegExp(`data-type=["']${escapeRegex(dataType)}["']`, "gi"),
  );
}

function countHtmlTag(html: string, tag: string): number {
  return countMatches(html, new RegExp(`<${tag}[\\s/>]`, "gi"));
}

function visibleText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function paragraphText(html: string): string {
  const paragraphs = html.match(/<p[\s>][\s\S]*?<\/p>/gi) ?? [];
  return paragraphs.map(visibleText).join(" ");
}

function countSentences(text: string): number {
  return text.split(/[.!?]+\s/).filter((sentence) => sentence.trim()).length;
}

export type SceneHtmlAnalysis = {
  headingCount: number;
  interactionCount: number;
  mediaCount: number;
  guideCount: number;
  listItemCount: number;
  sentenceCount: number;
  wordCount: number;
  hasEmDash: boolean;
};

export function analyzeSceneHtml(html: string): SceneHtmlAnalysis {
  const prose = paragraphText(html);

  return {
    headingCount: countMatches(html, /<h[1-6][\s>]/gi),
    interactionCount: SCENE_INTERACTION_DATA_TYPES.reduce(
      (total, dataType) => total + countDataType(html, dataType),
      0,
    ),
    mediaCount: SCENE_MEDIA_HTML_TAGS.reduce(
      (total, tag) => total + countHtmlTag(html, tag),
      0,
    ),
    guideCount: countDataType(html, GUIDE_CHARACTER_NODE_NAME),
    listItemCount: countHtmlTag(html, "li"),
    sentenceCount: countSentences(prose),
    wordCount: prose ? prose.split(/\s+/).length : 0,
    hasEmDash: /[—–]/.test(visibleText(html)),
  };
}
