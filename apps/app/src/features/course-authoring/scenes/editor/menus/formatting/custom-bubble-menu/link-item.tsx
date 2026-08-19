import type { FC } from "react";

import { Button } from "@scibly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { Input } from "@scibly/ui/components/input";
import { Check, Link, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ToolbarButton from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/toolbar-button";
import { isUrl } from "@/lib/utils";

const getUrlFromString = (str: string) => {
  const validUrl = isUrl(str);
  if (!validUrl) {
    toast.error("Bitte gib eine gültige URL ein.");
    return null;
  }
  if (!str.includes("http")) {
    str = `https://${str}`;
  }
  return str;
};

type LinkItemProps = {
  setLinkCommand: (url: string, inNewTab?: boolean) => void;
  unsetLinkCommand: () => void;
  currentLink: string;
};

export const LinkItem: FC<LinkItemProps> = ({
  setLinkCommand,
  currentLink,
  unsetLinkCommand,
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="Link">
          <Link size={15} />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        usePortal={false}
        className="mt-2 flex w-96 flex-col gap-1"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const entered = new FormData(e.currentTarget).get("url");
            if (typeof entered !== "string") return;
            const url = getUrlFromString(entered);
            if (url) {
              setLinkCommand(url);
            }
          }}
          className="flex gap-2 p-1"
        >
          <Input
            type="text"
            name="url"
            placeholder="Link einfügen"
            className="flex-1 rounded-sm border p-1 text-sm outline-none"
            defaultValue={currentLink}
          />
          <Button size="icon" className="h-8" type="submit">
            <Check className="h-4 w-4" />
          </Button>
        </form>
        {currentLink && (
          <Button
            size="icon"
            variant="destructive"
            type="button"
            className="flex h-8 w-auto items-center justify-between rounded-sm p-1 px-6"
            onClick={unsetLinkCommand}
          >
            <span>Link entfernen</span>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

LinkItem.displayName = "LinkItem";
export default LinkItem;
