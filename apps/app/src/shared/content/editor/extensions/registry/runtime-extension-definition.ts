import type {
  ExtensionArray,
  ExtensionConfig,
} from "@/shared/content/editor/extensions/types";

type RuntimeExtensionPlacement =
  | Readonly<{
      anchor: string;
      phase: "before-schema";
    }>
  | Readonly<{
      phase: "end";
    }>;

type RuntimeExtensionDefinitionOptions<Name extends string> = Readonly<{
  create(config: ExtensionConfig): ExtensionArray;
  name: Name;
  ownerPath: string;
  placement: RuntimeExtensionPlacement;
}>;

export class RuntimeExtensionDefinition<Name extends string = string> {
  readonly create: (config: ExtensionConfig) => ExtensionArray;
  readonly name: Name;
  readonly ownerPath: string;
  readonly placement: RuntimeExtensionPlacement;

  constructor(options: RuntimeExtensionDefinitionOptions<Name>) {
    this.create = options.create;
    this.name = options.name;
    this.ownerPath = options.ownerPath;
    this.placement = options.placement;
  }
}
