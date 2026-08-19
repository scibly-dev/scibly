import type { ReactNode } from "react";
import type { ModelSelectorOption } from "../../chat/model-selector";
import type { NotebookTranslations } from "../../i18n/notebook.types";

export interface WorkspaceLayoutCompositionProps {
  greeting: string;
  t: NotebookTranslations;
  modelOptions: readonly ModelSelectorOption[];
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
}

export type WorkspaceLayoutPresentation =
  | {
      type: "production";
      frame: "viewport";
      composer: "interactive";
    }
  | {
      type: "showcase";
      frame: "embedded";
      composer: "prompt-only";
      initialWorkspaceTitle: string;
      initialPromptValue: string;
      promptOptions: ReadonlyArray<{ label: string; prompt: string }>;
    };
