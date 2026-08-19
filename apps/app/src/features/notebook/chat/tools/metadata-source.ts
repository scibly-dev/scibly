import type { ToolMetadataRegistry, ToolOutput } from "./metadata";

import {
  firstSentence,
  formatSearchSources,
  humanSkillName,
  truncate,
} from "./metadata";

function webPageDetail(output: ToolOutput<"fetchWebPage">) {
  if (!output) return "";
  if ("error" in output) return output.error;
  const { charCount } = output;
  return [
    `${charCount.toLocaleString()} character${charCount === 1 ? "" : "s"}`,
    output.truncated ? "Truncated for context" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const SOURCE_TOOL_METADATA = {
  loadSkill: {
    iconId: "book",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Applied expert guidance" : "Loading expert guidance",
      context: humanSkillName(input.name ?? "skill"),
    }),
  },
  searchNotebookSources: {
    iconId: "search",
    getStepPresentation: ({ input, output, isDone }) => {
      const hitCount = output?.results.length;

      return {
        label: isDone ? "Searched your materials" : "Searching your materials",
        context: input.query
          ? `Looking for “${truncate(input.query, 72)}”`
          : undefined,
        detail: isDone
          ? [
              hitCount === 0
                ? "Nothing relevant turned up"
                : hitCount !== undefined
                  ? `${hitCount} useful excerpt${hitCount === 1 ? "" : "s"} found`
                  : undefined,
              formatSearchSources(output?.results ?? []),
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined,
      };
    },
  },
  readSource: {
    iconId: "book",
    getStepPresentation: ({ output, isDone }) => ({
      label: isDone ? "Read your material" : "Reading your material",

      detail:
        output && "content" in output
          ? firstSentence(output.content ?? "")
          : output?.message,
    }),
  },
  fetchWebPage: {
    iconId: "compass",
    getStepPresentation: ({ input, output, isDone }) => {
      const pageUrl = output?.finalUrl || input.url || undefined;
      const title =
        output && "title" in output ? output.title?.trim() : undefined;

      return {
        label: isDone ? "Fetched web page" : "Fetching web page",
        context: title,
        contextHref: pageUrl,
        detail: isDone ? webPageDetail(output) : undefined,
      };
    },
  },
  listNotebookMedia: {
    iconId: "search",
    getStepPresentation: ({ output, isDone }) => {
      const items = output?.items ?? [];
      const alts = items
        .map((item) => item.alt)
        .filter(Boolean)
        .slice(0, 2);

      return {
        label: isDone ? "Browsed media library" : "Browsing media library",
        context: alts.length
          ? alts.map((alt) => truncate(alt, 40)).join(", ")
          : undefined,
        detail: isDone
          ? [
              items.length
                ? `${items.length} image${items.length === 1 ? "" : "s"} on this page`
                : "No images yet",
              output?.nextCursor != null
                ? "More available — paginate with cursor"
                : undefined,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined,
      };
    },
  },
  generateImage: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Generated image" : "Generating image",
      context: input.alt ? truncate(input.alt, 72) : undefined,
    }),
  },
} satisfies ToolMetadataRegistry;
