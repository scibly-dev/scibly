import { cn } from "@scibly/ui/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-3 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-ink text-white shadow-[0_2px_0_0_#080f2c,0_4px_10px_-6px_rgba(15,35,61,0.3),inset_0_1px_0_rgba(255,255,255,0.22)]",
        secondary:
          "border-edge bg-ground text-ink-muted shadow-[0_2px_0_0_var(--color-edge),0_4px_10px_-6px_rgba(15,35,61,0.3),inset_0_1px_0_rgba(255,255,255,0.9)]",
        destructive:
          "border-[#e5484d] bg-[#e5484d] text-white shadow-[0_2px_0_0_#b7383c,0_4px_10px_-6px_rgba(15,35,61,0.3),inset_0_1px_0_rgba(255,255,255,0.28)]",
        outline:
          "border-edge bg-white text-ink-muted shadow-[0_2px_0_0_var(--color-edge),0_4px_10px_-6px_rgba(15,35,61,0.3),inset_0_1px_0_rgba(255,255,255,0.9)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
