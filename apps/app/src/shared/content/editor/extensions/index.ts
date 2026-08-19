import type {
  ExtensionArray,
  ExtensionConfig,
  SharedExtensionConfig,
} from "@/shared/content/editor/extensions/types";

import "katex/dist/katex.min.css";
import { getClientSchemaExtensions } from "@/shared/content/editor/blocks/registry/client";
import { clientEditorExtensionRegistry } from "@/shared/content/editor/extensions/registry/client";

export type { ExtensionArray, ExtensionConfig, SharedExtensionConfig };

const extensions = (config: ExtensionConfig): ExtensionArray =>
  clientEditorExtensionRegistry.materialize(
    config,
    getClientSchemaExtensions(),
  );

export default extensions;
