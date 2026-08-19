import type {
  Editor,
  Extension,
  Mark,
  Node,
  NodeViewRenderer,
} from "@tiptap/core";
import type { icons } from "lucide-react";

export type TiptapExtension = Extension | Mark | Node;

export type EditorSchemaSlot = "content" | "text";
export type EditorLocale = "de" | "en";
type SlashCommandGroupKey =
  | "advanced"
  | "basics"
  | "interactive"
  | "media"
  | "question";

type LocalizedCommandCopy = Readonly<{
  description: string;
  label: string;
}>;

export type SlashCommandMetadata = Readonly<{
  action(editor: Editor): void;
  aiCreditGated?: boolean;
  aliases: readonly string[];
  copy: Readonly<Record<EditorLocale, LocalizedCommandCopy>>;
  group: SlashCommandGroupKey;
  iconName: keyof typeof icons;
  name: string;
  order: number;
  shouldBeHidden?(editor: Editor): boolean;
}>;

export type SlashCommandGroupMetadata = Readonly<{
  copy: Readonly<Record<EditorLocale, string>>;
  key: SlashCommandGroupKey;
  order: number;
}>;

type LocalizedSlashCommand = Readonly<{
  action(editor: Editor): void;
  aiCreditGated?: boolean;
  aliases: string[];
  description: string;
  iconName: keyof typeof icons;
  label: string;
  name: string;
  shouldBeHidden?(editor: Editor): boolean;
}>;

export type LocalizedSlashCommandGroup = Readonly<{
  commands: LocalizedSlashCommand[];
  name: SlashCommandGroupKey;
  title: string;
}>;

type BlockPresentationMetadata = Readonly<{
  analyticsLabel: string;
  iconName: keyof typeof icons;
  userFriendlyName: string;
}>;

type RegisteredQuestionParser = Readonly<{
  getBlockType(): string;
}>;

export type NodeViewBindingMap = Readonly<
  Partial<Record<string, NodeViewRenderer>>
>;

export type FrameworkSchemaContext = Readonly<{
  documentContentExpression: string;
  stableIdNodeNames: readonly string[];
}>;

export type ClientNodeViewBinding = Readonly<{
  nodeView: NodeViewRenderer;
  nodeViewKey: string;
}>;

export type EditorSchemaExtensionEntry = Readonly<{
  extension: TiptapExtension;
  nodeViewKey?: string;
  withNodeView?: (nodeView: NodeViewRenderer) => Node;
}>;

type EditorSchemaDefinitionOptions<Name extends string = string> = Readonly<{
  documentGroup?: string;
  extensions: readonly EditorSchemaExtensionEntry[];
  mediaHtmlTag?: "audio" | "img" | "video";
  mediaOrder?: number;
  name: Name;
  presentation?: BlockPresentationMetadata;
  scene?: boolean;
  contractOrder?: number;
  slashCommands?: readonly SlashCommandMetadata[];
  slot: EditorSchemaSlot;
  stableId?: boolean;
  stableIdOrder?: number;
}>;

export abstract class EditorSchemaDefinition<Name extends string = string> {
  readonly documentGroup?: string;
  readonly extensions: readonly EditorSchemaExtensionEntry[];
  readonly mediaHtmlTag?: "audio" | "img" | "video";
  readonly mediaOrder: number;
  readonly name: Name;
  readonly presentation?: BlockPresentationMetadata;
  readonly scene: boolean;
  readonly contractOrder: number;
  readonly slashCommands: readonly SlashCommandMetadata[];
  readonly slot: EditorSchemaSlot;
  readonly stableId: boolean;
  readonly stableIdOrder: number;

  protected constructor(options: EditorSchemaDefinitionOptions<Name>) {
    this.name = options.name;
    this.slot = options.slot;
    this.extensions = options.extensions;
    this.mediaHtmlTag = options.mediaHtmlTag;
    this.mediaOrder = options.mediaOrder ?? 0;
    this.documentGroup = options.documentGroup;
    this.presentation = options.presentation;
    this.scene = options.scene ?? false;
    this.contractOrder = options.contractOrder ?? 0;
    this.slashCommands = options.slashCommands ?? [];
    this.stableId = options.stableId ?? false;
    this.stableIdOrder = options.stableIdOrder ?? 0;
  }

  materialize(
    nodeViews: NodeViewBindingMap = {},
    _context?: FrameworkSchemaContext,
  ): TiptapExtension[] {
    return this.materializeEntries(this.extensions, nodeViews);
  }

  protected materializeEntries(
    entries: readonly EditorSchemaExtensionEntry[],
    nodeViews: NodeViewBindingMap,
  ): TiptapExtension[] {
    return entries.map(({ extension, nodeViewKey, withNodeView }) => {
      if (!nodeViewKey || !withNodeView) return extension;
      const nodeView = nodeViews[nodeViewKey];
      return nodeView ? withNodeView(nodeView) : extension;
    });
  }
}

type BlockDefinitionOptions<Name extends string = string> =
  EditorSchemaDefinitionOptions<Name> & Readonly<{ ownerPath: string }>;

export class BlockDefinition<
  Name extends string = string,
> extends EditorSchemaDefinition<Name> {
  readonly ownerPath: string;

  constructor(options: BlockDefinitionOptions<Name>) {
    super(options);
    this.ownerPath = options.ownerPath;
  }
}

export class FrameworkSchemaDefinition<
  Name extends string = string,
> extends EditorSchemaDefinition<Name> {
  readonly ownerPath: string;
  private readonly createExtensions?: (
    context: FrameworkSchemaContext,
  ) => readonly EditorSchemaExtensionEntry[];

  constructor(
    options:
      | (EditorSchemaDefinitionOptions<Name> & Readonly<{ ownerPath: string }>)
      | (Omit<EditorSchemaDefinitionOptions<Name>, "extensions"> &
          Readonly<{
            createExtensions(
              context: FrameworkSchemaContext,
            ): readonly EditorSchemaExtensionEntry[];
            ownerPath: string;
          }>),
  ) {
    super({
      ...options,
      extensions: "extensions" in options ? options.extensions : [],
    });
    this.createExtensions =
      "createExtensions" in options ? options.createExtensions : undefined;
    this.ownerPath = options.ownerPath;
  }

  override materialize(
    nodeViews: NodeViewBindingMap = {},
    context?: FrameworkSchemaContext,
  ): TiptapExtension[] {
    if (!this.createExtensions) return super.materialize(nodeViews, context);
    if (!context) {
      throw new Error(
        `Framework schema definition "${this.name}" requires registry context.`,
      );
    }
    return this.materializeEntries(this.createExtensions(context), nodeViews);
  }
}

type QuestionBlockDefinitionOptions<
  Name extends string = string,
  Parser extends RegisteredQuestionParser = RegisteredQuestionParser,
> = BlockDefinitionOptions<Name> &
  Readonly<{
    parser: Parser;
  }>;

export class QuestionBlockDefinition<
  Name extends string = string,
  Parser extends RegisteredQuestionParser = RegisteredQuestionParser,
> extends BlockDefinition<Name> {
  readonly parser: Parser;

  constructor(options: QuestionBlockDefinitionOptions<Name, Parser>) {
    super(options);
    this.parser = options.parser;
  }
}
