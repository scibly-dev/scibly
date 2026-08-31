import type { BundleContent } from "../collect/bundle";
import type { TopicRepository } from "../topic-repositories";

import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import "server-only";
import { toSourcePassage } from "@/features/notebook/server";

import { FUNNEL } from "./thresholds";

/** On disk, next to the notebook skills, for the same reason: prose belongs in prose files. */
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

/**
 * Every URL a claim about this bundle is allowed to cite. Citations are checked
 * against this set, which is what stops a model inventing a link — the linked
 * issues are deliberately out, since they are references, not the discussion.
 */
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

/** `number` is the topic's position in this prompt — see `triageReply`. */
export const renderTopic = (topic: PromptTopic, number: number): string =>
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

const cut = (text: string, chars: number) =>
  text.length <= chars ? text : `${text.slice(0, chars)}…`;

type DigestComment = { author: string | null; body: string };

const excerpt = (c: DigestComment) =>
  `[${c.author ?? "unknown"}] ${cut(c.body.trim(), FUNNEL.triage.commentChars)}`;

const authorsOf = (comments: DigestComment[]) =>
  new Set(comments.map((c) => c.author ?? "unknown"));

/**
 * The shape of the conversation, which is what separates a discussion from a
 * rubber stamp: how many people spoke, and how many review threads more than
 * one of them spoke in.
 */
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
 * The part of the conversation triage has to read to score it. The body says
 * what was built; whether it was argued about lives in the comments, and a
 * digest carrying fifteen pull requests cannot hold all of them.
 *
 * Everything fits → everything goes in and no selection runs. Over budget:
 * review threads several people spoke in first, taking each one's opening and
 * closing comment, which is where a disagreement is raised and where it lands;
 * then top-level comments one per author in turn, so a single long-winded
 * reviewer cannot crowd out the person who objected once.
 *
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

/** What triage needs to sort by: the claim of the pull request, and the argument it drew. */
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

/** The whole conversation: extraction re-authors it, so it has to read it all. */
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

/** Every model reply here is one JSON object; nothing else is expected. */
export function parseJsonReply<T>(raw: string, schema: z.ZodType<T>): T | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return schema.safeParse(JSON.parse(raw.slice(start, end + 1))).data ?? null;
  } catch {
    return null;
  }
}
