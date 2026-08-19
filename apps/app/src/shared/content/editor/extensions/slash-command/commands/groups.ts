import type { Editor } from "@tiptap/core";
import type { EditorLocale } from "@/shared/content/editor/blocks/registry/types";
import type { Group } from "@/shared/content/editor/extensions/slash-command/types";

import { shouldHideSlashCommandInClozeContext } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-body-content";
import { shouldHideSlashCommandInMatchingPairsContext } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pair-side-content";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";

export const getLocalizedGroups = (
  locale: EditorLocale,
  hideAiCommands = false,
): Group[] =>
  editorSchemaRegistry.getSlashCommandGroups(locale).map((group) => ({
    ...group,
    commands: group.commands
      .filter((command) => !(hideAiCommands && command.aiCreditGated))
      .map((command) => {
        const previousHidden = command.shouldBeHidden;
        return {
          ...command,
          shouldBeHidden: (editor: Editor) =>
            shouldHideSlashCommandInClozeContext(editor, command.name) ||
            shouldHideSlashCommandInMatchingPairsContext(
              editor,
              command.name,
            ) ||
            (previousHidden?.(editor) ?? false),
        };
      }),
  }));

export default getLocalizedGroups;
