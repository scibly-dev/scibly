import type {
  ExtensionArray,
  ExtensionConfig,
} from "@/shared/content/editor/extensions/types";
import type { RuntimeExtensionDefinition } from "./runtime-extension-definition";

import { FinalizableRegistry } from "@/shared/content/editor/lib/finalizable-registry";

export class ClientEditorExtensionRegistry extends FinalizableRegistry<RuntimeExtensionDefinition> {
  protected override readonly definitionLabel =
    "client runtime extension definition";
  protected override readonly registryLabel =
    "client editor extension registry";

  register(...definitions: readonly RuntimeExtensionDefinition[]): this {
    this.registerDefinitions(...definitions);
    return this;
  }

  materialize(
    config: ExtensionConfig,
    schemaExtensions: ExtensionArray,
  ): ExtensionArray {
    this.assertFinalized("materialization");

    const schemaNames = new Set(
      schemaExtensions.map((extension) => extension.name),
    );
    const definitionsByAnchor = new Map<string, RuntimeExtensionDefinition[]>();
    const endDefinitions: RuntimeExtensionDefinition[] = [];

    for (const definition of this.getDefinitions()) {
      if (definition.placement.phase === "end") {
        endDefinitions.push(definition);
        continue;
      }

      const { anchor } = definition.placement;
      if (!schemaNames.has(anchor)) {
        throw new Error(
          `Missing schema extension anchor "${anchor}" for client runtime extension definition "${definition.name}" (${definition.ownerPath}).`,
        );
      }

      const anchoredDefinitions = definitionsByAnchor.get(anchor) ?? [];
      anchoredDefinitions.push(definition);
      definitionsByAnchor.set(anchor, anchoredDefinitions);
    }

    const result: ExtensionArray = [];
    for (const schemaExtension of schemaExtensions) {
      for (const definition of definitionsByAnchor.get(schemaExtension.name) ??
        []) {
        result.push(...definition.create(config));
      }
      result.push(schemaExtension);
    }
    for (const definition of endDefinitions) {
      result.push(...definition.create(config));
    }

    return result;
  }

  protected override getDefinitionKey(
    definition: RuntimeExtensionDefinition,
  ): string {
    return definition.name;
  }
}
