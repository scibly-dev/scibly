import type {
  SlashCommandGroupMetadata,
  SlashCommandMetadata,
} from "@/shared/content/editor/blocks/registry/types";

const EDITOR_LOCALES = ["de", "en"] as const;

function assertNonEmpty(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Slash command ${field} must not be empty.`);
  }
}

export function validateSlashCommand(command: SlashCommandMetadata): void {
  assertNonEmpty(command.name, "name");
  assertNonEmpty(command.iconName, `"${command.name}" icon`);
  if (!Number.isSafeInteger(command.order) || command.order < 0) {
    throw new Error(
      `Slash command "${command.name}" must have a non-negative integer order.`,
    );
  }
  if (!Array.isArray(command.aliases)) {
    throw new Error(
      `Slash command "${command.name}" aliases must be an array.`,
    );
  }
  if (typeof command.action !== "function") {
    throw new Error(`Slash command "${command.name}" must define an action.`);
  }
  for (const locale of EDITOR_LOCALES) {
    const copy = command.copy?.[locale];
    if (!copy) {
      throw new Error(
        `Slash command "${command.name}" is missing ${locale} copy.`,
      );
    }
    assertNonEmpty(copy.label, `"${command.name}" ${locale} label`);
    assertNonEmpty(copy.description, `"${command.name}" ${locale} description`);
  }
}

export function validateSlashCommandGroup(
  group: SlashCommandGroupMetadata,
): void {
  assertNonEmpty(group.key, "group key");
  if (!Number.isSafeInteger(group.order) || group.order < 0) {
    throw new Error(
      `Slash command group "${group.key}" must have a non-negative integer order.`,
    );
  }
  for (const locale of EDITOR_LOCALES) {
    const title = group.copy?.[locale];
    if (!title) {
      throw new Error(
        `Slash command group "${group.key}" is missing ${locale} title.`,
      );
    }
    assertNonEmpty(title, `group "${group.key}" ${locale} title`);
  }
}
