import { menuItemClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { forwardRef } from "react";

type DropdownButtonProps = {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export const DropdownButton = forwardRef<
  HTMLButtonElement,
  DropdownButtonProps
>(({ children, isActive, onClick, disabled, className }, ref) => {
  const buttonClass = cn(
    menuItemClass,
    "flex w-full cursor-pointer items-center gap-2 bg-transparent px-2 py-1 text-left text-sm font-medium",
    !isActive && !disabled && "hover:bg-ground",
    isActive && !disabled && "bg-ground",
    disabled && "text-ink-faint cursor-not-allowed",
    className,
  );

  return (
    <button
      ref={ref}
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

DropdownButton.displayName = "DropdownButton";

export default DropdownButton;
