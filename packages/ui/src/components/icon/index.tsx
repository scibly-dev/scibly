import { cn } from "@scibly/ui/utils";
import { icons } from "lucide-react";
import { memo } from "react";

export type IconProps = {
  name: keyof typeof icons;
  className?: string;
  strokeWidth?: number;
  size?: string | number;
};

const Icon = memo(({ name, className, strokeWidth, size }: IconProps) => {
  const IconComponent = icons[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      className={cn(!size && "h-6 w-6", className)}
      strokeWidth={strokeWidth || 2}
      size={size}
    />
  );
});
Icon.displayName = "Icon";
export default Icon;
