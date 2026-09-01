import type { BundleContent } from "../collect/bundle";
import type { TopicRepository } from "../topic-repositories";

import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import "server-only";
import { toSourcePassage } from "@/shared/ai/server/source-passage";

import { FUNNEL } from "./thresholds";

const PROMPT_ROOT = "knowledge-prompts";

const cache = new Map<string, string>();

export async function loadPrompt(name: "triage" | "extract"): Promise<string> {
  const cached = cache.get(name);
  if (cached && process.env.NODE_ENV === "production") return cached;

  const text = await fs.readFile(
    path.join(process.cwd(), PROMPT_ROOT, `${name}.md`),
    "utf8",
  );
  cache.set(name, text);
  return text;
}

const comment = z.object({
  author: z.string().nullable().catch(null),
  body: z.string().catch(""),
  url: z.string().catch(""),
  diffHunk: z.string().nullable().catch(null),
});

/** Lenient by design: stored JSON that lost a field is still worth reading. */
const bundleContent = z.object({
  title: z.string().catch(""),
  body: z.string().catch(""),
  url: z.string().catch(""),
  labels: z.array(z.string()).catch([]),
  filePaths: z.array(z.string()).catch([]),
  linkedIssues: z
    .array(
      z.object({
        number: z.number().catch(0),
        title: z.string().catch(""),
        url: z.string().catch(""),
      }),
    )
    .catch([]),
  comments: z.array(comment).catch([]),
  threads: z
    .array(
      z.object({
        path: z.string().nullable().catch(null),
        isResolved: z.boolean().catch(false),
        comments: z.array(comment).catch([]),
      }),
    )
    .catch([]),
});

export const parseBundleContent = (value: unknown): BundleContent | null =>
  bundleContent.safeParse(value).data ?? null;

/** Linked issues are deliberately out: they are references, not the discussion. */
export function citableUrls(content: BundleContent): Set<string> {
  return new Set(
    [
      content.url,
      ...content.comments.map((c) => c.url),
      ...content.threads.flatMap((t) => t.comments.map((c) => c.url)),
    ].filter((url) => url.length > 0),
  );
}

export type PromptTopic = {
  id: string;
  name: string;
  description: string;
  repositories: TopicRepository[];
};

const renderTopic = (topic: PromptTopic, number: number): string =>
  toSourcePassage(
    "topic",
    { id: number, name: topic.name },
    [
      topic.description,
      topic.repositories
        .map((repository) =>
          repository.pathGlobs.length === 0
            ? repository.fullName
            : `${repository.fullName} (${repository.pathGlobs.join(", ")})`,
        )
        .join("\n") || "no repositories",
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

/**
 * A topic is addressed by its 1-based position, never its cuid: a cheap model
 * miscopies a cuid, and 0 then reads as "none" rather than the first topic.
 */
export function numberTopics(topics: PromptTopic[]) {
  return {
    rendered: topics.map((topic, at) => renderTopic(topic, at + 1)),
    topicAt: new Map(topics.map((topic, at) => [at + 1, topic.id])),
  };
}

const cut = (text: string, chars: number) =>
  text.length <= chars ? text : `${text.slice(0, chars)}…`;

type DigestComment = { author: string | null; body: string };

const excerpt = (c: DigestComment) =>
  `[${c.author ?? "unknown"}] ${cut(c.body.trim(), FUNNEL.triage.commentChars)}`;

const authorsOf = (comments: DigestComment[]) =>
  new Set(comments.map((c) => c.author ?? "unknown"));

const renderStructure = (content: BundleContent): string => {
  const all = [
    ...content.comments,
    ...content.threads.flatMap((thread) => thread.comments),
  ];
  const people = authorsOf(all).size;
  const resolved = content.threads.filter((thread) => thread.isResolved).length;
  const argued = content.threads.filter(
    (thread) => authorsOf(thread.comments).size >= 2,
  ).length;
  const voices = `Comments: ${all.length} from ${people} ${people === 1 ? "person" : "people"}`;
  return content.threads.length === 0
    ? `${voices} · no review threads`
    : `${voices} · ${content.threads.length} review threads (${resolved} resolved, ${argued} with 2+ voices)`;
};

/**
 * ponytail: distinct authors stands in for disagreement — it cannot tell "+1"
 * from a rebuttal. Score the comments with a model if `worth` starts missing
 * discussions that mattered.
 */
export function pickDigestComments(content: BundleContent): string[] {
  const { commentBudget, minCommentChars } = FUNNEL.triage;
  const everything = [
    ...content.comments,
    ...content.threads.flatMap((thread) => thread.comments),
  ].map(excerpt);
  if (everything.join("\n").length <= commentBudget) return everything;

  const queue: DigestComment[] = [];
  for (const thread of content.threads) {
    if (authorsOf(thread.comments).size < 2) continue;
    const first = thread.comments[0];
    const last = thread.comments.at(-1);
    if (first) queue.push(first);
    if (last && last !== first) queue.push(last);
  }

  const byAuthor = new Map<string, DigestComment[]>();
  for (const c of content.comments) {
    if (c.body.trim().length < minCommentChars) continue;
    const key = c.author ?? "unknown";
    byAuthor.set(key, [...(byAuthor.get(key) ?? []), c]);
  }
  const rounds = Math.max(0, ...[...byAuthor.values()].map((cs) => cs.length));
  for (let round = 0; round < rounds; round += 1) {
    for (const comments of byAuthor.values()) {
      const c = comments[round];
      if (c) queue.push(c);
    }
  }

  const picked: string[] = [];
  let used = 0;
  for (const c of queue) {
    const line = excerpt(c);
    if (used + line.length > commentBudget) break;
    picked.push(line);
    used += line.length + 1;
  }
  return picked;
}

export const renderBundleDigest = (
  id: number,
  content: BundleContent,
): string =>
  toSourcePassage(
    "pull-request",
    { id, title: content.title, url: content.url },
    [
      content.labels.length > 0 ? `Labels: ${content.labels.join(", ")}` : "",
      content.filePaths.length > 0
        ? `Files: ${content.filePaths.slice(0, 20).join(", ")}`
        : "",
      renderStructure(content),
      cut(content.body, FUNNEL.triage.digestChars),
      ...pickDigestComments(content),
    ]
      .filter(Boolean)
      .join("\n"),
  );

const renderComment = (c: {
  author: string | null;
  body: string;
  url: string;
  diffHunk: string | null;
}) =>
  [
    `[${c.author ?? "unknown"}] ${c.url}`,
    c.diffHunk ? `diff:\n${c.diffHunk}` : "",
    c.body,
  ]
    .filter(Boolean)
    .join("\n");

/** The raw cuid is safe here: an extraction prompt carries exactly one bundle. */
export const renderBundle = (id: string, content: BundleContent): string =>
  toSourcePassage(
    "pull-request",
    { id, title: content.title, url: content.url },
    [
      content.labels.length > 0 ? `Labels: ${content.labels.join(", ")}` : "",
      content.filePaths.length > 0
        ? `Files: ${content.filePaths.join(", ")}`
        : "",
      content.body,
      ...content.comments.map(renderComment),
      ...content.threads.map((thread) =>
        [
          `--- review thread${thread.path ? ` on ${thread.path}` : ""}${
            thread.isResolved ? " (resolved)" : ""
          }`,
          ...thread.comments.map(renderComment),
        ].join("\n"),
      ),
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
