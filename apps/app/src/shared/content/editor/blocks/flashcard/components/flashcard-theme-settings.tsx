import { cn } from "@scibly/ui/utils";

import { objectKeys } from "@/lib/object-keys";
import {
  type FlashcardTheme,
  THEME_MAP,
} from "@/shared/content/editor/blocks/flashcard/components/flashcard-themes";

export function FlashcardThemeSettings({
  themeAttr,
  onThemeChange,
}: {
  themeAttr: FlashcardTheme;
  onThemeChange: (theme: FlashcardTheme) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <span className="text-[13px] font-medium text-neutral-500">Theme</span>
      <div className="flex gap-2">
        {objectKeys(THEME_MAP).map((t) => (
          <button
            key={t}
            onClick={() => onThemeChange(t)}
            aria-label={`Select ${t} theme`}
            className={cn(
              "h-6 w-6 rounded-full border shadow-sm transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none dark:focus-visible:ring-neutral-100",
              t === "default" &&
                "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
              t === "blue" &&
                "border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-900/40",
              t === "green" &&
                "border-green-200 bg-green-100 dark:border-green-800 dark:bg-green-900/40",
              t === "yellow" &&
                "border-yellow-200 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/40",
              themeAttr === t &&
                "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-neutral-950",
            )}
            title={t}
          />
        ))}
      </div>
    </div>
  );
}
