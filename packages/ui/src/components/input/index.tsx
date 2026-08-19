import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          fieldClass,
          "flex h-9 w-full rounded-xl px-3 py-1 text-[13px] file:border-0 file:bg-transparent file:text-[13px] file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
