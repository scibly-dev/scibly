/**
 * Type augmentation for Tiptap's NodeConfig and MarkConfig to support the
 * `addHtmlSchemaAwareness` extension hook.
 *
 * This hook is used by the Tiptap AI toolkit's `getHtmlSchemaAwareness` method
 * to build a schema description string that is injected into an AI model's
 * system prompt, preventing the model from generating unsupported HTML elements.
 *
 * @see https://tiptap.dev/docs/editor/ai/capabilities/schema-awareness
 */

export interface HtmlAttribute {
  attr: string;
  /**
   * If `value` is not undefined, the attribute always has that fixed value
   * for this element.
   */
  value?: string;

  description?: string | null;
}

export interface HtmlItem {
  tag: string;

  name: string;

  description?: string | null;

  attributes?: HtmlAttribute[];
}

/**
 * The `this` context that Tiptap passes to `addHtmlSchemaAwareness()` when
 * it is called on a Node or Mark extension.
 *
 * - `Config` — the parent config type (`NodeConfig` or `MarkConfig`)
 * - `Options` — the extension's options type
 * - `Storage` — the extension's storage type
 */
export type HtmlSchemaAwarenessContext<Config, Options = any, Storage = any> = {
  name: string;
  options: Options;
  storage: Storage;
  parent: Config | null;
};

declare module "@tiptap/core" {
  interface NodeConfig<Options = any, Storage = any> {
    /**
     * Provide schema awareness data for this node so that AI models understand
     * what HTML it produces and can avoid generating unsupported elements.
     */
    addHtmlSchemaAwareness?: (
      this: HtmlSchemaAwarenessContext<NodeConfig, Options, Storage>,
    ) => HtmlItem;
  }

  interface MarkConfig<Options = any, Storage = any> {
    /**
     * Provide schema awareness data for this mark so that AI models understand
     * what HTML it produces and can avoid generating unsupported elements.
     */
    addHtmlSchemaAwareness?: (
      this: HtmlSchemaAwarenessContext<MarkConfig, Options, Storage>,
    ) => HtmlItem;
  }
}
