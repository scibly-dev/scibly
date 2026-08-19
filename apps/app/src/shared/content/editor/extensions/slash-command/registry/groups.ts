import type { SlashCommandGroupMetadata } from "@/shared/content/editor/blocks/registry/types";

export const SLASH_COMMAND_GROUPS = [
  {
    key: "basics",
    order: 10,
    copy: { de: "Basisblöcke", en: "Basic blocks" },
  },
  {
    key: "media",
    order: 20,
    copy: { de: "Medien", en: "Media" },
  },
  {
    key: "advanced",
    order: 30,
    copy: {
      de: "Fortgeschrittene Blöcke",
      en: "Advanced blocks",
    },
  },
  {
    key: "interactive",
    order: 40,
    copy: {
      de: "Interaktive Blöcke",
      en: "Interactive blocks",
    },
  },
  {
    key: "question",
    order: 50,
    copy: { de: "Frageblöcke", en: "Question blocks" },
  },
] as const satisfies readonly SlashCommandGroupMetadata[];
