"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  const resolved: ToasterProps["theme"] =
    theme === "light" || theme === "dark" ? theme : "system";

  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-2 group-[.toaster]:border-hairline group-[.toaster]:bg-white group-[.toaster]:text-ink group-[.toaster]:shadow-[0_4px_0_0_var(--color-lip)] dark:group-[.toaster]:border-neutral-800 dark:group-[.toaster]:bg-neutral-950 dark:group-[.toaster]:text-neutral-50 dark:group-[.toaster]:shadow-none",
          description: "group-[.toast]:text-ink-muted",
          actionButton:
            "group-[.toast]:rounded-[10px] group-[.toast]:bg-[#0066FF] group-[.toast]:font-bold group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:rounded-[10px] group-[.toast]:bg-ground group-[.toast]:font-bold group-[.toast]:text-ink-muted",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
