import { routes } from "@scibly/routes";
import { CircleDot, Container, type LucideIcon, Terminal } from "lucide-react";

import { type Pillar, PILLARS } from "@/app/[lang]/components/marketing-tokens";

/* The transcript stays untranslated: `docker compose up` prints English in every locale. */
export const MONO_FONT = 'ui-monospace, "SFMono-Regular", Menlo, monospace';

const SELF_HOST_STEP_IDS = ["clone", "boot", "issue"] as const;

type SelfHostStepId = (typeof SELF_HOST_STEP_IDS)[number];

export const toSelfHostStepId = (id: string): SelfHostStepId | undefined =>
  SELF_HOST_STEP_IDS.find((known) => known === id);

type TerminalLineTone = "log" | "ok" | "port";

export type TerminalLine = {
  tone: TerminalLineTone;
  text: string;
  value?: string;
};

type SelfHostStep = {
  pillar: Pillar;
  icon: LucideIcon;
  command: string;
  lines: readonly TerminalLine[];
};

export const SELF_HOST_STEPS = {
  clone: {
    pillar: PILLARS.import,
    icon: Terminal,
    command: "git clone https://github.com/scibly-dev/scibly",
    lines: [
      { tone: "log", text: "Cloning into 'scibly'..." },
      { tone: "log", text: "remote: Counting objects: 100%, done." },
      { tone: "ok", text: "apps/  packages/  ee/  docs/" },
    ],
  },
  boot: {
    pillar: PILLARS.channels,
    icon: Container,
    command: "docker compose up -d --build",
    lines: [
      { tone: "ok", text: "Container scibly-postgres-1  Started" },
      { tone: "port", text: "web", value: "http://localhost:3000" },
      { tone: "port", text: "app", value: "http://localhost:3001" },
      { tone: "port", text: "collab", value: "ws://localhost:4000" },
    ],
  },
  issue: {
    pillar: PILLARS.analytics,
    icon: CircleDot,
    command: "gh issue create --repo scibly-dev/scibly",
    lines: [
      { tone: "log", text: "Creating issue in scibly-dev/scibly" },
      { tone: "log", text: "? Title  SCORM export for course packages" },
      { tone: "ok", text: "? What's next?  Submit" },
    ],
  },
} satisfies Record<SelfHostStepId, SelfHostStep>;

export function transcriptOf(step: SelfHostStep): string {
  return step.lines
    .map((line) => [line.text, line.value].filter(Boolean).join(" "))
    .join(" · ");
}

export const SELF_HOSTING_GUIDE_HREF =
  routes.external.github.file("docs/docker.md");
