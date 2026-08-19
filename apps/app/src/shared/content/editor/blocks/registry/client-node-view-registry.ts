import type { EditorSchemaRegistry } from "./editor-schema-registry";
import type { ClientNodeViewBinding, NodeViewBindingMap } from "./types";
import type { EditorSchemaDefinition } from "./types";

import { FinalizableRegistry } from "@/shared/content/editor/lib/finalizable-registry";

export class ClientNodeViewRegistry extends FinalizableRegistry<ClientNodeViewBinding> {
  protected override readonly definitionLabel =
    "client NodeView binding for nodeViewKey";
  protected override readonly registryLabel = "client NodeView registry";

  private readonly requiredKeys: ReadonlySet<string>;

  constructor(
    editorSchemaRegistry: EditorSchemaRegistry<
      readonly EditorSchemaDefinition[]
    >,
  ) {
    super();
    this.requiredKeys = new Set(editorSchemaRegistry.getRequiredNodeViewKeys());
  }

  register(...ownerBindings: readonly ClientNodeViewBinding[]): this {
    this.registerDefinitions(...ownerBindings);
    return this;
  }

  getBindings(): NodeViewBindingMap {
    this.assertFinalized("materialization");
    return Object.freeze(
      Object.fromEntries(
        this.getDefinitions().map(({ nodeViewKey, nodeView }) => [
          nodeViewKey,
          nodeView,
        ]),
      ),
    );
  }

  protected override getDefinitionKey({
    nodeViewKey,
  }: ClientNodeViewBinding): string {
    return nodeViewKey;
  }

  protected override validateDefinition({
    nodeViewKey,
  }: ClientNodeViewBinding): void {
    if (!this.requiredKeys.has(nodeViewKey)) {
      throw new Error(
        `Unknown client NodeView binding "${nodeViewKey}"; no shared schema entry declares this nodeViewKey.`,
      );
    }
  }

  protected override validateFinalization(): void {
    const missingKeys = [...this.requiredKeys].filter(
      (nodeViewKey) => !this.getDefinition(nodeViewKey),
    );
    if (missingKeys.length > 0) {
      throw new Error(
        `Missing client NodeView bindings for shared nodeViewKeys: ${missingKeys
          .map((nodeViewKey) => `"${nodeViewKey}"`)
          .join(", ")}.`,
      );
    }
  }
}
