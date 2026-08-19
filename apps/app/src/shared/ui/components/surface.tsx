import { floatingPanelClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { forwardRef, type HTMLProps } from "react";

type SurfaceProps = HTMLProps<HTMLDivElement> & {
  withShadow?: boolean;
  withBorder?: boolean;
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    { children, className, withShadow = true, withBorder = true, ...props },
    ref,
  ) => {
    const surfaceClass = cn(
      className,
      floatingPanelClass,
      "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:shadow-none",
      withShadow ? "" : "shadow-none",
      withBorder ? "" : "border-transparent",
    );

    return (
      <div className={surfaceClass} {...props} ref={ref}>
        {children}
      </div>
    );
  },
);

Surface.displayName = "Surface";
