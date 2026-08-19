import { applySelectionColorDefinition } from "@/shared/content/editor/extensions/apply-selection-color/definition";
import { autoJoinDefinition } from "@/shared/content/editor/extensions/auto-join/definition";
import { collaborationDefinition } from "@/shared/content/editor/extensions/collaboration/definition";
import { cursorNavigationDefinition } from "@/shared/content/editor/extensions/cursor-navigation/definition";
import { editorCountDefinition } from "@/shared/content/editor/extensions/editor-count/definition";
import { fileHandlerDefinition } from "@/shared/content/editor/extensions/file-handler/definition";
import { focusDefinition } from "@/shared/content/editor/extensions/focus/definition";
import { globalDragHandleDefinition } from "@/shared/content/editor/extensions/global-drag-handle/definition";
import { placeholderDefinition } from "@/shared/content/editor/extensions/placeholder/definition";
import { slashCommandDefinition } from "@/shared/content/editor/extensions/slash-command/definition";
import { typographyDefinition } from "@/shared/content/editor/extensions/typography/definition";
import { undoRedoDefinition } from "@/shared/content/editor/extensions/undo-redo/definition";

import { ClientEditorExtensionRegistry } from "./client-editor-extension-registry";

export const clientEditorExtensionRegistry = new ClientEditorExtensionRegistry()
  .register(
    cursorNavigationDefinition,
    autoJoinDefinition,
    globalDragHandleDefinition,
    typographyDefinition,
    placeholderDefinition,
    focusDefinition,
    fileHandlerDefinition,
    editorCountDefinition,
    slashCommandDefinition,
    applySelectionColorDefinition,
    collaborationDefinition,
    undoRedoDefinition,
  )
  .finalize();
