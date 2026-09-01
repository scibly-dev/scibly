import type { PullRequestDetail } from "@/features/integrations/server";

import { CHARS_PER_TOKEN, estimateTokens } from "@/shared/ai/token-estimate";
import { sanitizeSourceTextForIndexing } from "@/shared/content/sources/sanitize-source-text";

/** Per-bundle cap, not per-prompt: a model reads several bundles alongside each other. */
export const BUNDLE_LIMITS = {
  maxTokens: 6_000,
  diffHunkLines: 20,
} as const;

type BundleComment = {
  author: string | null;
  body: string;
  url: string;
  diffHunk: string | null;
};

export type BundleContent = {
  title: string;
  body: string;
  url: string;
  labels: string[];
  filePaths: string[];
  linkedIssues: { number: number; title: string; url: string }[];
  comments: BundleComment[];
  threads: {
    path: string | null;
    isResolved: boolean;
    comments: BundleComment[];
  }[];
};

const trimHunk = (hunk: string | null) => {
  if (!hunk) return null;
  const lines = hunk.split("\n");
  return lines.length <= BUNDLE_LIMITS.diffHunkLines
    ? hunk
    : `${lines.slice(0, BUNDLE_LIMITS.diffHunkLines).join("\n")}\n…`;
};

const cleanComment = (source: BundleComment) => ({
  author: source.author,
  body: sanitizeSourceTextForIndexing(source.body),
  url: source.url,
  diffHunk: trimHunk(source.diffHunk),
});

const overshootChars = (content: BundleContent) =>
  (estimateTokens(JSON.stringify(content)) - BUNDLE_LIMITS.maxTokens) *
  CHARS_PER_TOKEN;

const cutTo = (text: string, chars: number) =>
  text.length <= chars ? text : `${text.slice(0, Math.max(chars - 1, 0))}…`;

/** Cut order: body, then shallowest threads — the deep back-and-forth is the material. */
export function buildBundleContent(detail: PullRequestDetail) {
  const threads = detail.threads.map((thread) => ({
    path: thread.path,
    isResolved: thread.isResolved,
    comments: thread.comments.map(cleanComment),
  }));
  const content: BundleContent = {
    title: sanitizeSourceTextForIndexing(detail.title),
    body: sanitizeSourceTextForIndexing(detail.body),
    url: detail.url,
    labels: [...detail.labels],
    filePaths: [...detail.filePaths],
    linkedIssues: [...detail.linkedIssues],
    comments: detail.comments.map(cleanComment),
    threads,
  };

  let truncated = detail.filesTruncated;

  const bodyOvershoot = overshootChars(content);
  if (bodyOvershoot > 0 && content.body.length > 0) {
    content.body = cutTo(content.body, content.body.length - bodyOvershoot);
    truncated = true;
  }

  const droppableOrder = threads
    .map((thread, index) => ({ index, depth: thread.comments.length }))
    .sort((a, b) => a.depth - b.depth || a.index - b.index)
    .map(({ index }) => index);

  const dropped = new Set<number>();
  for (const index of droppableOrder) {
    if (overshootChars(content) <= 0) break;
    dropped.add(index);
    content.threads = threads.filter((_, at) => !dropped.has(at));
    truncated = true;
  }

  while (overshootChars(content) > 0 && content.comments.length > 0) {
    content.comments = content.comments.slice(0, -1);
    truncated = true;
  }

  return { content, truncated };
}
