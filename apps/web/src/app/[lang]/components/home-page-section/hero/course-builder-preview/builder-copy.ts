import { type HeroDictionary, type SlashCommandId } from "../i18n/hero.types";

export type CourseBuilderCopy = HeroDictionary["courseBuilder"];

export type SlashCommand = Omit<
  CourseBuilderCopy["slashCommands"][number],
  "id"
> & { id: SlashCommandId };
