import type React from "react";

import {
  BookOpen,
  FileQuestion,
  GitFork,
  type icons,
  Image,
  Layers,
  type LucideIcon,
  Presentation,
  ScrollText,
  Table,
  Video,
  Volume2,
} from "lucide-react";

// Interface only — the actual map + logos live in provider-display.tsx (JSX cannot be in a .ts file).

export interface ProviderDisplayConfig {
  readonly name: string;

  readonly subtitle: string;

  readonly Logo: React.ComponentType<{ className?: string }>;
}

interface StudioToolConfig {
  readonly id: string;
  readonly Icon: LucideIcon;
  readonly theme: string;
}

export const STUDIO_TOOLS = [
  {
    id: "courseBuilder",
    Icon: BookOpen,
    theme:
      "bg-blue-200 text-blue-700 shadow-[0_3px_0_0_var(--color-blue-400)] dark:bg-blue-500/10 dark:text-blue-400 dark:shadow-none",
  },
  {
    id: "imageEditor",
    Icon: Image,
    theme:
      "bg-violet-200 text-violet-700 shadow-[0_3px_0_0_var(--color-violet-400)] dark:bg-violet-500/10 dark:text-violet-400 dark:shadow-none",
  },
  {
    id: "audio",
    Icon: Volume2,
    theme:
      "bg-amber-200 text-amber-700 shadow-[0_3px_0_0_var(--color-amber-400)] dark:bg-amber-500/10 dark:text-amber-400 dark:shadow-none",
  },
  {
    id: "presentation",
    Icon: Presentation,
    theme:
      "bg-sky-200 text-sky-700 shadow-[0_3px_0_0_var(--color-sky-400)] dark:bg-sky-500/10 dark:text-sky-400 dark:shadow-none",
  },
  {
    id: "video",
    Icon: Video,
    theme:
      "bg-emerald-200 text-emerald-700 shadow-[0_3px_0_0_var(--color-emerald-400)] dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-none",
  },
  {
    id: "mindmap",
    Icon: GitFork,
    theme:
      "bg-purple-200 text-purple-700 shadow-[0_3px_0_0_var(--color-purple-400)] dark:bg-purple-500/10 dark:text-purple-400 dark:shadow-none",
  },
  {
    id: "reports",
    Icon: ScrollText,
    theme:
      "bg-rose-200 text-rose-700 shadow-[0_3px_0_0_var(--color-rose-400)] dark:bg-rose-500/10 dark:text-rose-400 dark:shadow-none",
  },
  {
    id: "flashcards",
    Icon: Layers,
    theme:
      "bg-indigo-200 text-indigo-700 shadow-[0_3px_0_0_var(--color-indigo-400)] dark:bg-indigo-500/10 dark:text-indigo-400 dark:shadow-none",
  },
  {
    id: "quiz",
    Icon: FileQuestion,
    theme:
      "bg-orange-200 text-orange-700 shadow-[0_3px_0_0_var(--color-orange-400)] dark:bg-orange-500/10 dark:text-orange-400 dark:shadow-none",
  },
  {
    id: "dataTable",
    Icon: Table,
    theme:
      "bg-cyan-200 text-cyan-700 shadow-[0_3px_0_0_var(--color-cyan-400)] dark:bg-cyan-500/10 dark:text-cyan-400 dark:shadow-none",
  },
] as const satisfies ReadonlyArray<StudioToolConfig>;

interface SourceDisplayConfig {
  readonly icon: keyof typeof icons;
  readonly theme: string;
}

const SOURCE_DISPLAY_MAP = new Map<string, SourceDisplayConfig>([
  [
    "pdf",
    {
      icon: "FileText",
      theme:
        "bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    },
  ],
  [
    "docx",
    {
      icon: "FileText",
      theme:
        "bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    },
  ],
  [
    "text",
    {
      icon: "ClipboardPaste",
      theme:
        "bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    },
  ],
  [
    "image",
    {
      icon: "Presentation",
      theme:
        "bg-violet-50 text-violet-500 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30",
    },
  ],
  [
    "notion_page",
    {
      icon: "FileText",
      theme:
        "bg-neutral-50 text-neutral-800 border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-200 dark:border-neutral-700/50",
    },
  ],
  [
    "confluence_page",
    {
      icon: "ExternalLink",
      theme:
        "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    },
  ],
  [
    "sharepoint_page",
    {
      icon: "FileText",
      theme:
        "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30",
    },
  ],
]);

const DEFAULT_SOURCE_DISPLAY: SourceDisplayConfig = {
  icon: "FileText",
  theme:
    "bg-neutral-50 text-neutral-500 border-neutral-100 dark:bg-neutral-950/20 dark:text-neutral-400 dark:border-neutral-900/30",
};

export function getSourceDisplayConfig(type: string): SourceDisplayConfig {
  return SOURCE_DISPLAY_MAP.get(type.toLowerCase()) ?? DEFAULT_SOURCE_DISPLAY;
}
