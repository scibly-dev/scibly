// The `ink`/`hairline`/`lip`/`ground`/`ease-press` tokens these classes reference are defined in `styles/globals.css`.

export const actionClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold no-underline transition-[translate,box-shadow,background-color] duration-100 ease-press active:translate-y-[3px] focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

export const primaryActionClass =
  "bg-[#0066FF] text-white shadow-[0_3px_0_0_#0046ad,0_5px_12px_-6px_rgba(0,70,173,0.4),inset_0_1px_0_rgba(255,255,255,0.28)] hover:bg-[#1a76ff] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

export const secondaryActionClass =
  "border border-ink/[0.08] bg-white text-ink shadow-[0_3px_0_0_rgba(19,28,70,0.07),0_5px_12px_-6px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-[#f7f9fd] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]";

// Ported from the marketing site's `keyShadow()` — keep the two in sync.
export const keyShadowClass =
  "shadow-[0_2px_0_0_var(--color-edge),0_4px_10px_-6px_rgba(15,35,61,0.3),inset_0_1px_0_rgba(255,255,255,0.9)]";

export const linkClass =
  "font-medium text-link underline decoration-[#b9d7ff] decoration-2 underline-offset-[3px] transition-colors hover:decoration-[#7ab4ff]";

export const pageTitleClass =
  "m-0 text-[clamp(34px,5vw,60px)] leading-[1.07] font-medium tracking-[-0.028em] text-balance text-ink";

export const titleClass =
  "m-0 text-[clamp(32px,3.6vw,50px)] leading-[1.08] font-medium tracking-[-0.028em] text-balance text-ink";

export const eyebrowClass =
  "m-0 text-[13.5px] leading-none font-semibold text-ink-soft";

export const subtitleClass =
  "m-0 text-[17px] leading-[1.6] text-pretty text-ink-muted";

export const cardClass =
  "rounded-[20px] border-2 border-hairline bg-white shadow-[0_4px_0_0_var(--color-lip)]";

export const cardInteractiveClass =
  "transition-[translate,box-shadow,border-color] duration-150 ease-press hover:border-edge active:translate-y-[3px] active:shadow-none";

export const floatingPanelClass =
  "rounded-2xl border-2 border-hairline bg-white text-ink shadow-[0_4px_0_0_var(--color-lip)]";

// Keyed off `data-state` rather than `:active`, so it doesn't fight a control's own active rule.
export const triggerOpenClass =
  "data-[state=open]:translate-y-[2px] data-[state=open]:shadow-none [&_svg.lucide-chevron-down]:transition-transform [&_svg.lucide-chevron-down]:duration-200 data-[state=open]:[&_svg.lucide-chevron-down]:rotate-180";

export const menuItemClass =
  "rounded-[10px] text-ink transition-colors focus:bg-ground focus:text-ink data-disabled:pointer-events-none data-disabled:opacity-50";

export const chipClass =
  "cursor-pointer rounded-xl border-2 px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-[translate,box-shadow,background-color,border-color] duration-100 ease-press active:translate-y-[3px] active:shadow-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none";

export const chipActiveClass =
  "border-[#0066FF] bg-[#0066FF] text-white shadow-[0_3px_0_0_#0046ad]";

// Uses `--color-edge`, not `--color-lip` like the other keys — chips sit on tinted ground, where `--color-lip` reads lighter than the surface and looks like a flat cut.
export const chipRestClass =
  "border-hairline bg-white text-ink-muted shadow-[0_3px_0_0_var(--color-edge)] hover:border-edge hover:text-ink";

export const fieldClass =
  "border-2 border-hairline bg-white text-ink placeholder:text-ink-faint shadow-[0_2px_0_0_var(--color-lip)] transition-[border-color,box-shadow] duration-150 ease-press focus-visible:border-[#b9d7ff] focus-visible:ring-4 focus-visible:ring-[#0066FF]/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
