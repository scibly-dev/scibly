import { cn } from "@scibly/ui/utils";

import {
  notebookBorder,
  notebookMessageSurface,
} from "../../../workspace/components/notebook-shell";

export function UxCardShell({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px]",
        notebookBorder,
        notebookMessageSurface,
        className,
      )}
      {...props}
    />
  );
}
