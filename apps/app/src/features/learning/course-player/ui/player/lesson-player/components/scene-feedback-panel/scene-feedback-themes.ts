import { PERFECT_FEEDBACK_TOKENS } from "@scibly/ui/product-tokens";
import { cn } from "@scibly/ui/utils";

export const FEEDBACK_THEMES = {
  perfect: {
    shell: PERFECT_FEEDBACK_TOKENS.shell,
    title: PERFECT_FEEDBACK_TOKENS.title,
    subtitle: "text-[#4b9a00]",
    iconBg: PERFECT_FEEDBACK_TOKENS.iconBg,
    button: cn(
      PERFECT_FEEDBACK_TOKENS.action,
      "shadow-[0_4px_0_0_#46a302] hover:brightness-105",
    ),
    buttonDisabled: "bg-[#a5d68a] text-white/70 shadow-[0_4px_0_0_#8bc472]",
    answerBox: "bg-green-50 border border-green-200/90 text-green-800",
    correctionCard: "bg-white/45 border-white/60",
    tabTrigger:
      "inline-flex items-center gap-1.5 rounded-xl border-2 border-transparent px-2.5 py-1.5 text-sm font-extrabold tabular-nums transition-all bg-white/50 text-[#4b9a00] opacity-80 data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-[#58a700] data-[state=active]:opacity-100 data-[state=active]:shadow-[0_3px_0_0_rgba(70,163,2,0.25)]",
  },
  partial: {
    shell: "bg-[#fff4cc]",
    title: "text-[#cd7900]",
    subtitle: "text-[#a86200]",
    iconBg: "bg-[#ffc800] shadow-[0_3px_0_0_#e6b400]",
    button:
      "bg-[#ffc800] text-white shadow-[0_4px_0_0_#e6b400] hover:brightness-105",
    buttonDisabled: "bg-[#ffe799] text-white/70 shadow-[0_4px_0_0_#e6d080]",
    answerBox: "bg-green-50 border border-green-200/90 text-green-800",
    correctionCard: "bg-white/45 border-white/60",
    tabTrigger:
      "inline-flex items-center gap-1.5 rounded-xl border-2 border-transparent px-2.5 py-1.5 text-sm font-extrabold tabular-nums transition-all bg-white/50 text-[#a86200] opacity-80 data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-[#cd7900] data-[state=active]:opacity-100 data-[state=active]:shadow-[0_3px_0_0_rgba(230,180,0,0.3)]",
  },
  incorrect: {
    shell: "bg-[#ffdfdf]",
    title: "text-[#ea2b2b]",
    subtitle: "text-[#c42424]",
    iconBg: "bg-[#ff4b4b] shadow-[0_3px_0_0_#e03e3e]",
    button:
      "bg-[#ff4b4b] text-white shadow-[0_4px_0_0_#e03e3e] hover:brightness-105",
    buttonDisabled: "bg-[#ffb5b5] text-white/70 shadow-[0_4px_0_0_#e8a0a0]",
    answerBox: "bg-green-50 border border-green-200/90 text-green-800",
    correctionCard: "bg-white/50 border-white/70",
    tabTrigger:
      "inline-flex items-center gap-1.5 rounded-xl border-2 border-transparent px-2.5 py-1.5 text-sm font-extrabold tabular-nums transition-all bg-white/50 text-[#c42424] opacity-80 data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-[#ea2b2b] data-[state=active]:opacity-100 data-[state=active]:shadow-[0_3px_0_0_rgba(224,62,62,0.25)]",
  },
} as const;
