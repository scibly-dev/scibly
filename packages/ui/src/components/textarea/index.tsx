import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import * as React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          fieldClass,
          "flex min-h-[60px] w-full rounded-xl px-3 py-2 text-[13px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
