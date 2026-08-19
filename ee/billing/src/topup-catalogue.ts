// One-off generations that never expire; spent only after the monthly allowance runs out.
type TopupPack = {
  credits: number;

  priceCents: number;
};

export const TOPUP_PACK_KEYS = ["small", "large"] as const;

export type TopupPackKey = (typeof TOPUP_PACK_KEYS)[number];

export const TOPUP_PACKS = {
  small: { credits: 250, priceCents: 1_900 },
  large: { credits: 1_000, priceCents: 5_900 },
} satisfies Record<TopupPackKey, TopupPack>;

export const isTopupPackKey = (value: string): value is TopupPackKey =>
  TOPUP_PACK_KEYS.some((key) => key === value);
