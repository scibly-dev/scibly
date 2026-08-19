"use client";

import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { chipRestClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Plus, X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add a tag...",
  buttonLabel = "Add",
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        <Button
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
          variant="outline"
          className="flex items-center gap-1 px-3"
          type="button"
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, i) => (
            <span
              key={i}
              className={cn(
                chipRestClass,
                "flex items-center rounded-lg border-2 px-2.5 py-1 text-[13px] font-semibold",
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-ink-faint hover:bg-hairline hover:text-ink ml-1.5 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
                <span className="sr-only">Remove tag</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
