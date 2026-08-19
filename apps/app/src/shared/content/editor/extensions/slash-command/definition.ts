import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

import SlashCommand from ".";

export const slashCommandDefinition = new RuntimeExtensionDefinition({
  name: "slash-command",
  ownerPath: "slash-command",
  placement: { phase: "end" },
  create: () => [SlashCommand],
});
