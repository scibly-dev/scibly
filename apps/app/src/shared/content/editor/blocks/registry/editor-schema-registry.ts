import type {
  EditorLocale,
  LocalizedSlashCommandGroup,
  NodeViewBindingMap,
  SlashCommandGroupMetadata,
  TiptapExtension,
} from "./types";

import {
  validateSlashCommand,
  validateSlashCommandGroup,
} from "@/shared/content/editor/extensions/slash-command/registry/validation";
import { FinalizableRegistry } from "@/shared/content/editor/lib/finalizable-registry";

import {
  type EditorSchemaDefinition,
  type EditorSchemaSlot,
  type FrameworkSchemaContext,
  FrameworkSchemaDefinition,
  QuestionBlockDefinition,
} from "./types";

type RegisteredDefinition<
  Definitions extends readonly EditorSchemaDefinition[],
> = Definitions[number];

type RegisteredQuestionDefinition<
  Definitions extends readonly EditorSchemaDefinition[],
> = Extract<RegisteredDefinition<Definitions>, QuestionBlockDefinition>;

type RegisteredQuestionName<
  Definitions extends readonly EditorSchemaDefinition[],
> = RegisteredQuestionDefinition<Definitions>["name"];

export class EditorSchemaRegistry<
  Definitions extends readonly EditorSchemaDefinition[] = readonly [],
> extends FinalizableRegistry<EditorSchemaDefinition, Definitions> {
  protected override readonly definitionLabel = "editor schema definition";
  protected override readonly registryLabel = "editor schema registry";

  private readonly questionNames = new Set<string>();
  private readonly requiredNodeViewKeys = new Set<string>();
  private readonly slashCommandGroups = new Map<
    string,
    SlashCommandGroupMetadata
  >();
  private readonly slashCommandNames = new Set<string>();
  private readonly slashCommandOrders = new Map<string, string>();
  private readonly slashGroupOrders = new Map<number, string>();

  registerSlashCommandGroups(
    ...groups: readonly SlashCommandGroupMetadata[]
  ): this {
    this.assertMutable();
    const keys = new Set(this.slashCommandGroups.keys());
    const orders = new Map(this.slashGroupOrders);
    for (const group of groups) {
      validateSlashCommandGroup(group);
      if (keys.has(group.key)) {
        throw new Error(`Duplicate slash command group "${group.key}".`);
      }
      const existingOrder = orders.get(group.order);
      if (existingOrder) {
        throw new Error(
          `Slash command groups "${existingOrder}" and "${group.key}" share order ${group.order}.`,
        );
      }
      keys.add(group.key);
      orders.set(group.order, group.key);
    }
    for (const group of groups) {
      this.slashCommandGroups.set(group.key, group);
      this.slashGroupOrders.set(group.order, group.key);
    }
    return this;
  }

  register<const Definition extends EditorSchemaDefinition>(
    definition: Definition,
  ): EditorSchemaRegistry<[...Definitions, Definition]> {
    this.registerDefinitions(definition);

    // SAFETY: registration mutates in place; the return type is the tuple grown

    // eslint-disable-next-line anti-slop/no-chained-type-assertions -- see above
    return this as unknown as EditorSchemaRegistry<
      [...Definitions, Definition]
    >;
  }

  override getDefinitions(): Definitions;
  override getDefinitions(
    slot: EditorSchemaSlot,
  ): readonly EditorSchemaDefinition[];
  override getDefinitions(
    slot?: EditorSchemaSlot,
  ): Definitions | readonly EditorSchemaDefinition[] {
    const definitions = super.getDefinitions();
    if (!slot) {
      return definitions;
    }
    return definitions.filter((definition) => definition.slot === slot);
  }

  getQuestionDefinitions(): readonly RegisteredQuestionDefinition<Definitions>[] {
    return this.getDefinitions()
      .filter(
        (definition): definition is RegisteredQuestionDefinition<Definitions> =>
          definition instanceof QuestionBlockDefinition,
      )
      .toSorted((left, right) => left.contractOrder - right.contractOrder);
  }

  getQuestionNames(): readonly RegisteredQuestionName<Definitions>[] {
    return this.getQuestionDefinitions().map(({ name }) => name);
  }

  isQuestionName(value: string): value is RegisteredQuestionName<Definitions> {
    return this.questionNames.has(value);
  }

  getTopLevelDocumentGroups(): readonly string[] {
    const groups = new Set<string>(["block"]);
    for (const { documentGroup } of this.getDefinitions()) {
      if (documentGroup) groups.add(documentGroup);
    }
    return [...groups];
  }

  getDocumentContentExpression(): string {
    return `(${this.getTopLevelDocumentGroups().join("|")})+`;
  }

  getStableIdNames(): readonly string[] {
    return this.getDefinitions()
      .filter(({ stableId }) => stableId)
      .toSorted((left, right) => left.stableIdOrder - right.stableIdOrder)
      .map(({ name }) => name);
  }

  getSceneNames(): readonly string[] {
    return this.getDefinitions()
      .filter(({ scene }) => scene)
      .map(({ name }) => name);
  }

  getSceneMediaHtmlTags(): readonly ("audio" | "img" | "video")[] {
    return this.getDefinitions()
      .filter(({ mediaHtmlTag }) => Boolean(mediaHtmlTag))
      .toSorted((left, right) => left.mediaOrder - right.mediaOrder)
      .map(({ mediaHtmlTag }) => mediaHtmlTag!);
  }

  getRequiredNodeViewKeys(): readonly string[] {
    return [...this.requiredNodeViewKeys];
  }

  getSlashCommandGroups(locale: EditorLocale): LocalizedSlashCommandGroup[] {
    this.assertFinalized("projecting slash commands");
    const commands = this.getDefinitions().flatMap(
      ({ slashCommands }) => slashCommands,
    );
    return [...this.slashCommandGroups.values()]
      .toSorted((left, right) => left.order - right.order)
      .map((group) => ({
        name: group.key,
        title: group.copy[locale],
        commands: commands
          .filter((command) => command.group === group.key)
          .toSorted((left, right) => left.order - right.order)
          .map((command) => ({
            name: command.name,
            iconName: command.iconName,
            aliases: [...command.aliases],
            ...command.copy[locale],
            action: command.action,
            shouldBeHidden: command.shouldBeHidden,
            aiCreditGated: command.aiCreditGated,
          })),
      }));
  }

  materializeSchemaExtensions(
    nodeViews: NodeViewBindingMap,
    slot?: EditorSchemaSlot,
  ): TiptapExtension[] {
    return this.getDefinitionsForSlot(slot).flatMap((definition) =>
      definition.materialize(nodeViews, this.createFrameworkContext()),
    );
  }

  materializeFrameworkDefinition(
    name: RegisteredDefinition<Definitions>["name"],
    nodeViews: NodeViewBindingMap = {},
  ): TiptapExtension[] {
    const definition = this.getDefinition(name);
    if (!(definition instanceof FrameworkSchemaDefinition)) {
      throw new Error(
        `Editor schema definition "${name}" is not a framework definition.`,
      );
    }
    return definition.materialize(nodeViews, this.createFrameworkContext());
  }

  protected override getDefinitionKey(
    definition: EditorSchemaDefinition,
  ): string {
    return definition.name;
  }

  protected override onRegister(definition: EditorSchemaDefinition): void {
    if (definition instanceof QuestionBlockDefinition) {
      this.questionNames.add(definition.name);
    }
    for (const command of definition.slashCommands) {
      this.slashCommandNames.add(command.name);
      this.slashCommandOrders.set(
        `${command.group}:${command.order}`,
        command.name,
      );
    }
    for (const { nodeViewKey } of definition.extensions) {
      if (nodeViewKey) this.requiredNodeViewKeys.add(nodeViewKey);
    }
  }

  protected override validateDefinition(
    definition: EditorSchemaDefinition,
  ): void {
    const definitionNames = new Set<string>();
    const definitionOrders = new Map<string, string>();
    for (const command of definition.slashCommands) {
      validateSlashCommand(command);
      if (!this.slashCommandGroups.has(command.group)) {
        throw new Error(
          `Slash command "${command.name}" references unknown group "${command.group}".`,
        );
      }
      if (
        this.slashCommandNames.has(command.name) ||
        definitionNames.has(command.name)
      ) {
        throw new Error(`Duplicate slash command "${command.name}".`);
      }
      const orderKey = `${command.group}:${command.order}`;
      const existingOrder =
        this.slashCommandOrders.get(orderKey) ?? definitionOrders.get(orderKey);
      if (existingOrder) {
        throw new Error(
          `Slash commands "${existingOrder}" and "${command.name}" share order ${command.order} in group "${command.group}".`,
        );
      }
      definitionNames.add(command.name);
      definitionOrders.set(orderKey, command.name);
    }
  }

  private createFrameworkContext(): FrameworkSchemaContext {
    return {
      documentContentExpression: this.getDocumentContentExpression(),
      stableIdNodeNames: this.getStableIdNames(),
    };
  }

  private getDefinitionsForSlot(
    slot?: EditorSchemaSlot,
  ): readonly EditorSchemaDefinition[] {
    return slot ? this.getDefinitions(slot) : this.getDefinitions();
  }
}
