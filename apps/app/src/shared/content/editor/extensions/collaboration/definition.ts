import type { ExtensionArray } from "@/shared/content/editor/extensions/types";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

const CARET_COLORS = [
  "#f783ac",
  "#74c0fc",
  "#63e6be",
  "#ffd43b",
  "#ff922b",
  "#da77f2",
  "#a9e34b",
  "#ff6b6b",
  "#4ecdc4",
  "#845ef7",
] as const;

function userColor(userName: string): string {
  let hash = 0;
  for (const character of userName) {
    hash = character.charCodeAt(0) + ((hash << 5) - hash);
  }
  return CARET_COLORS[Math.abs(hash) % CARET_COLORS.length] ?? CARET_COLORS[0];
}

export const collaborationDefinition = new RuntimeExtensionDefinition({
  name: "collaboration",
  ownerPath: "collaboration",
  placement: { phase: "end" },
  create: (config) => {
    if (config.mode !== "collaborative") return [];

    const { disableCursors, provider, ydoc } = config.collaboration;
    const extensions: ExtensionArray = [
      Collaboration.configure({ document: ydoc }),
    ];
    if (provider && !disableCursors) {
      extensions.push(
        CollaborationCaret.configure({
          provider,
          user: {
            color: userColor(config.userName),
            name: config.userName,
          },
        }),
      );
    }
    return extensions;
  },
});
