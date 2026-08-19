"use client";

import {
  Columns2,
  EyeOff,
  FileText,
  GalleryHorizontalEnd,
  GripHorizontal,
  ListChecks,
  type LucideIcon,
  MessageCircle,
  SpellCheck2,
  TextCursorInput,
} from "lucide-react";
import {
  Fragment,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";

import { PRODUCT_INK } from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_META, previewCardStyle } from "../hero-preview-kit";
import {
  type SlashCommandGroup,
  type SlashCommandId,
  toSlashCommandId,
} from "../i18n/hero.types";
import { type CourseBuilderCopy, type SlashCommand } from "./builder-copy";
import { PILLAR, rowMarkerStyle, SELECTED } from "./builder-theme";

const SLASH_ICONS = {
  hint: EyeOff,
  flashcard: GalleryHorizontalEnd,
  character: MessageCircle,
  input: TextCursorInput,
  multipleChoice: ListChecks,
  cloze: SpellCheck2,
  dragDrop: GripHorizontal,
  freeForm: FileText,
  matching: Columns2,
} satisfies Record<SlashCommandId, LucideIcon>;

export function SlashCommandMenu({
  t,
  activeId,
}: {
  t: CourseBuilderCopy;
  activeId: SlashCommandId | null;
}) {
  const commandsIn = (group: SlashCommandGroup) =>
    t.slashCommands.flatMap((command) => {
      const id = toSlashCommandId(command.id);
      return id && command.group === group ? [{ ...command, id }] : [];
    });
  const groups = [
    { title: t.slashInteractiveTitle, commands: commandsIn("interactive") },
    { title: t.slashQuestionTitle, commands: commandsIn("question") },
  ];

  const activeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = activeRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;

    const elRect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    if (elRect.top < cRect.top) {
      container.scrollTop -= cRect.top - elRect.top;
    } else if (elRect.bottom > cRect.bottom) {
      container.scrollTop += elRect.bottom - cRect.bottom;
    }
  }, [activeId]);

  return (
    <div
      className="overflow-hidden rounded-[14px] border"
      style={previewCardStyle(PILLAR)}
    >
      <div
        ref={scrollRef}
        className="max-h-[158px] overflow-y-auto p-1.5 md:max-h-[174px]"
      >
        <div className="grid grid-cols-1 gap-0.5">
          {groups.map(({ title, commands }) => (
            <Fragment key={title}>
              <SlashGroupTitle>{title}</SlashGroupTitle>
              {commands.map((command) => (
                <SlashCommandRow
                  key={command.id}
                  command={command}
                  active={activeId === command.id}
                  rowRef={activeId === command.id ? activeRef : undefined}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlashGroupTitle({ children }: { children: ReactNode }) {
  return (
    <div
      className="col-span-full mt-2 px-1.5 pb-0.5 text-[8.5px] font-bold tracking-[0.08em] uppercase select-none first:mt-0"
      style={{ color: PREVIEW_META }}
    >
      {children}
    </div>
  );
}

function SlashCommandRow({
  command,
  active,
  rowRef,
}: {
  command: SlashCommand;
  active?: boolean;
  rowRef?: RefObject<HTMLDivElement | null>;
}) {
  const Icon = SLASH_ICONS[command.id];

  return (
    <div
      ref={rowRef}
      className="flex w-full items-center gap-1.5 rounded-[9px] border px-1.5 py-1 text-left"
      style={
        active
          ? flatKey(SELECTED, 2)
          : { borderColor: "transparent", color: PRODUCT_INK }
      }
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-[6px] border"
        style={rowMarkerStyle(active)}
      >
        <Icon className="size-3" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[10.5px] font-bold">
          {command.label}
        </span>
        <p
          className="m-0 truncate text-[8.5px] leading-snug font-medium"
          style={{ color: PREVIEW_META }}
        >
          {command.description}
        </p>
      </div>
    </div>
  );
}
