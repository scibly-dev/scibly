import { primaryActionClass } from "@scibly/ui/design-language";
import { NOTEBOOK_PRODUCT_TOKENS } from "@scibly/ui/product-tokens";

export const notebookShell = `${NOTEBOOK_PRODUCT_TOKENS.workspaceSurface} dark:bg-neutral-950`;

export const notebookShellPadding = "p-1.5 md:p-2";

export const notebookAppFrame =
  "border-hairline flex min-h-0 w-full flex-1 overflow-hidden rounded-[22px] border-2 bg-white shadow-[0_4px_0_0_var(--color-edge)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none";

export const notebookSidebar = "bg-white dark:bg-neutral-950";

export const notebookSidebarBorder = `${NOTEBOOK_PRODUCT_TOKENS.divider} dark:border-neutral-800`;

export const notebookCanvas = "bg-white dark:bg-neutral-950";

export const notebookTimelineSurface = `${NOTEBOOK_PRODUCT_TOKENS.insetSurface} dark:bg-neutral-900/50`;

export const notebookTimelineFrame =
  "flex min-h-0 flex-1 flex-col bg-white p-0.5 dark:bg-neutral-950 md:p-1";

export const notebookTimelineInset = `border-hairline flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border-2 ${NOTEBOOK_PRODUCT_TOKENS.insetSurface} shadow-[inset_0_2px_4px_rgba(19,28,70,0.05)] dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none md:rounded-[18px]`;

export const notebookTimelineScrollFade =
  "before:from-[#f7f6f3] dark:before:from-neutral-900/50";

export const notebookMessageSurface =
  "border-hairline border-2 bg-white shadow-[0_2px_0_0_var(--color-lip)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none";

export const notebookNavActive = `${NOTEBOOK_PRODUCT_TOKENS.subduedSurface} ${NOTEBOOK_PRODUCT_TOKENS.strongText} font-semibold dark:bg-neutral-900 dark:text-neutral-50`;

export const notebookNavIdle = `${NOTEBOOK_PRODUCT_TOKENS.secondaryText} hover:bg-ground-soft hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-900/60 dark:hover:text-neutral-100`;

export const notebookIconButton = `${NOTEBOOK_PRODUCT_TOKENS.mutedText} transition-colors hover:bg-ground hover:text-ink dark:hover:bg-neutral-900 dark:hover:text-neutral-100`;

export const notebookListHover =
  "hover:bg-ground-soft dark:hover:bg-neutral-900/60";

export const notebookToolRow =
  "border-hairline hover:border-edge flex items-center justify-between gap-3 rounded-xl border-2 bg-white px-3 py-2.5 text-left shadow-[0_2px_0_0_var(--color-lip)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none";

export const notebookToolRowPress =
  "ease-press transition-[translate,box-shadow,border-color] duration-100 active:translate-y-[2px] active:shadow-none";

export const notebookToolTile =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]";

export const notebookMutedText = `${NOTEBOOK_PRODUCT_TOKENS.secondaryText} dark:text-neutral-400`;

export const notebookBorder = `${NOTEBOOK_PRODUCT_TOKENS.divider} dark:border-neutral-800`;

export const notebookPrimaryButton = `${primaryActionClass} ease-press transition-[translate,box-shadow,background-color] duration-100 active:translate-y-[3px] dark:bg-neutral-100 dark:text-neutral-900 dark:shadow-none dark:hover:bg-neutral-200`;

export const notebookHeaderBar = `border-b-2 ${NOTEBOOK_PRODUCT_TOKENS.divider} dark:border-neutral-800`;
