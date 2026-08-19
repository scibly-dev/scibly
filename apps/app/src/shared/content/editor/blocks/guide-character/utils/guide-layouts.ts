export const GUIDE_LAYOUT_IDS = ["left", "right", "top", "inline"] as const;

export type GuideLayoutId = (typeof GUIDE_LAYOUT_IDS)[number];

type GuideLayoutMeta = {
  id: GuideLayoutId;
  label: string;
  description: string;
};

export const GUIDE_LAYOUTS = {
  left: {
    id: "left",
    label: "Left",
    description: "Character on the left, speech bubble on the right.",
  },
  right: {
    id: "right",
    label: "Right",
    description: "Speech bubble on the left, character on the right.",
  },
  top: {
    id: "top",
    label: "Top",
    description: "Character centered above a full-width speech bubble.",
  },
  inline: {
    id: "inline",
    label: "Inline",
    description: "Compact avatar inside the speech bubble corner.",
  },
} satisfies Record<GuideLayoutId, GuideLayoutMeta>;

export function normalizeGuideLayoutId(
  value: string | null | undefined,
): GuideLayoutId {
  return GUIDE_LAYOUT_IDS.find((id) => id === value) ?? "left";
}
