"use client";

import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { useMemo } from "react";
import CodeEditor from "react-simple-code-editor";

// The `.token` colours the highlighter emits live in the editor's prism theme.
import "@/shared/content/editor/styles/nodes/code/code-block.css";
import Prism from "@/shared/content/editor/blocks/code/prism/prism";
import {
  getGrammar,
  type LanguageOptions,
} from "@/shared/content/editor/blocks/code/prism/prismUtils";

export function CodeField({
  value,
  language,
  placeholder,
  onChange,
}: {
  value: string;
  language: LanguageOptions;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  // react-simple-code-editor calls `highlight` from its render body: an inline
  // arrow re-tokenizes the whole app on every keystroke.
  const highlighted = useMemo(
    () => Prism.highlight(value, getGrammar(language), language),
    [value, language],
  );
  return (
    <div
      className={cn(
        fieldClass,
        "bg-ground-soft text-ink min-h-0 flex-1 overflow-auto rounded-xl focus-within:border-[#b9d7ff] focus-within:ring-4 focus-within:ring-[#0066FF]/15 dark:bg-neutral-950",
      )}
    >
      <CodeEditor
        value={value}
        onValueChange={onChange}
        highlight={() => highlighted}
        placeholder={placeholder}
        padding={12}
        textareaClassName="outline-none"
        style={{
          minHeight: "100%",
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12.5,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}
