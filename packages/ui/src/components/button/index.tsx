import { Slot } from "@radix-ui/react-slot";
import { primaryActionClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const neutralActionClass =
  "border-2 border-hairline bg-white text-ink shadow-[0_3px_0_0_var(--color-lip)] hover:border-edge hover:bg-[#f7f9fd] active:shadow-none";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold transition-[translate,box-shadow,background-color,border-color] duration-100 ease-press active:translate-y-[3px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: primaryActionClass,
        brand: primaryActionClass,

        ink: "bg-ink text-white shadow-[0_3px_0_0_#0a1030,inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#1d2860] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
        destructive:
          "bg-[#e5484d] text-white shadow-[0_3px_0_0_#b0272c,inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[#ec5f63] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] focus-visible:ring-[#e5484d]/25",
        outline: neutralActionClass,
        secondary: neutralActionClass,

        ghost:
          "text-ink-muted active:translate-y-0 hover:bg-ink/[0.05] hover:text-ink",
        link: "text-link underline decoration-[#b9d7ff] decoration-2 underline-offset-[3px] active:translate-y-0 hover:decoration-[#7ab4ff]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[10px] px-3 text-[12px]",
        lg: "h-11 px-6 text-[14px] font-bold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
