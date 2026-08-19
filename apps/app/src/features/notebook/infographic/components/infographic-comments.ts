import {
  DEFAULT_REGION_RADIUS,
  formatPercent,
} from "@/features/notebook/media/tools/image-schemas";

export interface InfographicImageComment {
  id: string;
  x: number;
  y: number;
  radius: number;
  text: string;
}

export function createInfographicComment(
  x: number,
  y: number,
  radius: number = DEFAULT_REGION_RADIUS,
): InfographicImageComment {
  return {
    id: crypto.randomUUID(),
    x,
    y,
    radius,
    text: "",
  };
}

interface BuildCommentsPromptInput {
  comments: InfographicImageComment[];
  additionalNotes?: string;
  intro: string;
  itemTemplate: string;
  additionalTemplate: string;
}

export function buildInfographicCommentsPrompt({
  comments,
  additionalNotes,
  intro,
  itemTemplate,
  additionalTemplate,
}: BuildCommentsPromptInput): string {
  const filledComments = comments.filter((comment) => comment.text.trim());
  const additional = additionalNotes?.trim() ?? "";
  if (filledComments.length === 0 && !additional) return "";

  const lines = [intro];
  let filledIndex = 0;

  for (const comment of comments) {
    const text = comment.text.trim();
    if (!text) continue;

    filledIndex += 1;
    lines.push(
      itemTemplate
        .replace("{index}", String(filledIndex))
        .replace("{x}", formatPercent(comment.x))
        .replace("{y}", formatPercent(comment.y))
        .replace("{text}", text),
    );
  }

  if (additional) {
    lines.push(additionalTemplate.replace("{text}", additional));
  }

  return lines.join("\n");
}
