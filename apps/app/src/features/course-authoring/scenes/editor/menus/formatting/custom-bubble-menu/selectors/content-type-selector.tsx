import type {
  ChangeNodeMenuGroup,
  ChangeNodeMenuItem,
} from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-change-node-menu-items";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import Icon from "@scibly/ui/components/icon";
import { ChevronDown } from "lucide-react";
import { type FC, useMemo } from "react";

import ToolbarButton from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/toolbar-button";
import { ScrollArea } from "@/shared/ui/components/scroll-area";

type ContentTypeSelectorProps = {
  groups: ChangeNodeMenuGroup[];
  currentNode: ChangeNodeMenuItem | undefined;
};

export const ContentTypeSelector: FC<ContentTypeSelectorProps> = ({
  groups,
  currentNode,
}) => {
  const filteredGroups = useMemo(() => {
    return groups.filter((group) =>
      group.items.some((item) => !item.isDisabled?.()),
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, currentNode]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="In umwandeln">
          <span
            className="text-ink min-w-fit text-xs font-semibold text-nowrap"
            style={{ fontFamily: "Arial" }}
          >
            {}
            {currentNode?.title || "Absatz"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      {filteredGroups.length > 0 ? (
        <DropdownMenuContent usePortal={false} className="mt-2 w-56">
          <ScrollArea className="max-h-[min(60vh,35rem)] overflow-auto">
            {filteredGroups.map((group) => (
              <DropdownMenuGroup key={group.title}>
                <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
                {group.items.map((item) => {
                  return (
                    <DropdownMenuItem
                      key={item.title}
                      onSelect={() => {
                        item.command();
                      }}
                      className="flex gap-2"
                    >
                      <Icon name={item.icon} className="h-4 w-4" />
                      {item.title}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      ) : (
        <DropdownMenuContent usePortal={false} className="mt-2 w-56">
          <div className="flex items-center justify-center py-2">
            <span className="text-ink text-sm">
              Keine Inhaltsarten verfügbar
            </span>
          </div>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};
export default ContentTypeSelector;
