import { cn } from "@scibly/ui/utils";
import { type ComponentPropsWithoutRef } from "react";

export function MockWindow({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px] border border-[#dde2f0] bg-white shadow-[0_10px_28px_-16px_rgba(19,28,70,0.45)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
