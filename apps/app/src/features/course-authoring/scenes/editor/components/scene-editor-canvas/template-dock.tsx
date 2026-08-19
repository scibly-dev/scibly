"use client";

import type { Editor } from "@tiptap/core";

import { Button } from "@scibly/ui/components/button";
import { floatingPanelClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { TEMPLATES } from "./templates";

interface TemplateDockProps {
  editor: Editor | null;
}

export function TemplateDock({ editor }: TemplateDockProps) {
  if (!editor) return null;

  return (
    <div
      className={cn(
        floatingPanelClass,
        "absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 p-2 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none",
      )}
    >
      {TEMPLATES.map((template, index) => (
        <div key={template.id} className="flex items-center gap-1.5">
          {index > 0 && (
            <div className="bg-hairline mx-1 h-6 w-px dark:bg-neutral-800" />
          )}
          <Button
            id={`template-dock-${template.id}`}
            variant="ghost"
            size="sm"
            className="text-ink-muted hover:bg-ground hover:text-ink h-10 gap-2.5 rounded-[10px] px-4 text-[14px] font-semibold dark:text-neutral-300 dark:hover:bg-neutral-800"
            onClick={() => template.insert(editor)}
          >
            {template.icon}
            {template.label}
          </Button>
        </div>
      ))}
    </div>
  );
}
