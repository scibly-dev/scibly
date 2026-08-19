import type {
  ClozeSegment,
  TextSegment,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

export function createTextSegment(content = "", id?: string): TextSegment {
  return { type: "text", id: id ?? `seg-${crypto.randomUUID()}`, content };
}

export function normalizeAuthorSegments(
  segments: ClozeSegment[],
): ClozeSegment[] {
  if (segments.length === 0) {
    return [createTextSegment()];
  }

  let normalized =
    segments[0]?.type !== "text"
      ? [createTextSegment(), ...segments]
      : [...segments];

  normalized = normalized.filter((segment, index, arr) => {
    if (segment.type !== "text" || segment.content !== "") return true;
    const prev = arr[index - 1];
    const next = arr[index + 1];
    return !(prev?.type === "gap" && next?.type === "gap");
  });

  return normalized;
}
