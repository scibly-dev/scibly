import type { CSSProperties } from "react";

import {
  type Pillar,
  washStyle,
} from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "./keyframes";

export const productRootClass =
  "relative flex h-full w-full items-center justify-center overflow-hidden px-5 py-4 md:px-6";

export const productColumnClass =
  "flex h-full w-full max-w-[470px] min-h-0 flex-col";

export const productLabelClass = "text-[13px] font-semibold text-ink-soft";

export const productTitleClass = "truncate text-[15.5px] font-bold text-ink";

export const productMetaClass = "truncate text-[12.5px] text-ink-soft";

export const productKeyClass =
  "flex items-center gap-3 rounded-[13px] border-2 px-3.5 py-3 text-[15px] leading-snug font-bold";

export const productPanelClass =
  "flex h-full min-h-0 flex-col rounded-[20px] border p-5 md:p-6";

export function panelStyle(pillar: Pillar, delay: string): CSSProperties {
  return {
    ...washStyle(pillar),
    animation: `sc-rise 750ms ${BENTO_EASE} ${delay} both`,
  };
}
