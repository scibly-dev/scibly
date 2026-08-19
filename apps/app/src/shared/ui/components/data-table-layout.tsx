import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { type ReactNode } from "react";

interface DataTableLayoutProps {
  toolbar?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  className?: string;
  heightClass?: string;
}

export function DataTableLayout({
  toolbar,
  children,
  pagination,
  className,
  heightClass = "h-[70vh]",
}: DataTableLayoutProps) {
  return (
    <div
      className={cn(
        cardClass,
        "flex flex-col overflow-hidden",
        heightClass,
        className,
      )}
    >
      {toolbar && (
        <div className="border-hairline flex flex-none flex-col gap-3 border-b-2 p-4">
          {toolbar}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">{children}</div>

      {pagination && (
        <div className="border-hairline bg-ground-soft z-10 flex-none border-t-2 p-4">
          {pagination}
        </div>
      )}
    </div>
  );
}
