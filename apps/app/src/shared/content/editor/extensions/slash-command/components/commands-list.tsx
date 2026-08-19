"use client";

import type { Editor } from "@tiptap/core";
import type {
  Command,
  Group,
} from "@/shared/content/editor/extensions/slash-command/types";

import Icon from "@scibly/ui/components/icon";
import { floatingPanelClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

import DropdownButton from "@/shared/content/editor/extensions/slash-command/components/dropdown-button";
import { ScrollArea } from "@/shared/ui/components/scroll-area";

interface MenuListProps {
  editor: Editor;
  items: Group[];
  command: (command: Command) => void;
}

export const CommandList = React.forwardRef((props: MenuListProps, ref) => {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const activeItem = useRef(
    props.items.map((group) =>
      Array<HTMLButtonElement | null>(group.commands.length).fill(null),
    ),
  );
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  useEffect(() => {
    setSelectedGroupIndex(0);
    setSelectedCommandIndex(0);
  }, [props.items]);

  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const command = props.items[groupIndex]!.commands[commandIndex]!;
      props.command(command);
    },
    [props],
  );

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === "ArrowDown") {
        if (!props.items.length) {
          return false;
        }

        const commands = props.items[selectedGroupIndex]!.commands;

        let newCommandIndex = selectedCommandIndex + 1;
        let newGroupIndex = selectedGroupIndex;

        if (commands.length - 1 < newCommandIndex) {
          newCommandIndex = 0;
          newGroupIndex = selectedGroupIndex + 1;
        }

        if (props.items.length - 1 < newGroupIndex) {
          newGroupIndex = 0;
        }

        setSelectedCommandIndex(newCommandIndex);
        setSelectedGroupIndex(newGroupIndex);

        return true;
      }

      if (event.key === "ArrowUp") {
        if (!props.items.length) {
          return false;
        }

        let newCommandIndex = selectedCommandIndex - 1;
        let newGroupIndex = selectedGroupIndex;

        if (newCommandIndex < 0) {
          newGroupIndex = selectedGroupIndex - 1;
          if (newGroupIndex < 0) {
            newCommandIndex = 0;
          } else {
            newCommandIndex = props.items[newGroupIndex]!.commands.length - 1;
          }
        }

        if (newGroupIndex < 0) {
          newGroupIndex = props.items.length - 1;
          newCommandIndex = props.items[newGroupIndex]!.commands.length - 1;
        }

        setSelectedCommandIndex(newCommandIndex);
        setSelectedGroupIndex(newGroupIndex);

        return true;
      }

      if (event.key === "Enter") {
        if (
          !props.items.length ||
          selectedGroupIndex === -1 ||
          selectedCommandIndex === -1
        ) {
          return false;
        }

        selectItem(selectedGroupIndex, selectedCommandIndex);

        return true;
      }

      return false;
    },
  }));

  useEffect(() => {
    if (activeItem.current) {
      const currentCommand = activeItem.current[selectedGroupIndex];
      if (currentCommand) {
        currentCommand[selectedCommandIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedCommandIndex, selectedGroupIndex]);

  const createCommandClickHandler = useCallback(
    (groupIndex: number, commandIndex: number) => {
      return () => {
        selectItem(groupIndex, commandIndex);
      };
    },
    [selectItem],
  );

  if (!props.items.length) {
    return null;
  }

  return (
    <ScrollArea
      ref={scrollContainer}
      className={cn(
        floatingPanelClass,
        "joyride-commands-list z-50 w-80 overflow-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none",
      )}
    >
      <div className="max-h-[min(40vh,30rem)] overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-1">
          {props.items.map((group, groupIndex: number) => (
            <React.Fragment key={`${group.title}-wrapper`}>
              <div
                className="text-ink-faint col-span-full mt-4 px-2 text-[11px] font-bold tracking-wider uppercase select-none first:mt-0.5"
                key={`${group.title}`}
              >
                {group.title}
              </div>
              {group.commands.map((command: Command, commandIndex: number) => (
                <DropdownButton
                  ref={(ref) => {
                    if (!activeItem.current[groupIndex]) return;
                    activeItem.current[groupIndex][commandIndex] = ref;
                  }}
                  key={`${command.label}`}
                  isActive={
                    selectedGroupIndex === groupIndex &&
                    selectedCommandIndex === commandIndex
                  }
                  onClick={createCommandClickHandler(groupIndex, commandIndex)}
                  className={cn(
                    "dark:hover:bg-neutral-900",
                    selectedGroupIndex === groupIndex &&
                      selectedCommandIndex === commandIndex &&
                      "dark:bg-neutral-900",
                  )}
                >
                  <div className="border-hairline rounded-[8px] border-2 bg-white p-2 shadow-[0_2px_0_0_var(--color-lip)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
                    {typeof command.iconName === "string" ? (
                      <Icon
                        name={command.iconName}
                        className="text-ink-muted h-6 w-6"
                      />
                    ) : (
                      <Image
                        src={command.iconName}
                        alt={command.label}
                        className="h-6 w-6"
                      />
                    )}
                  </div>

                  <div>
                    <span className="text-ink text-sm font-semibold">
                      {command.label}
                    </span>
                    <p className="text-ink-muted text-xs dark:text-neutral-400">
                      {command.description}
                    </p>
                  </div>
                </DropdownButton>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
});

CommandList.displayName = "CommandList";

export default CommandList;
