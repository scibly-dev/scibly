"use client";

import { eyebrowClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { useScrollSpy } from "./hooks/use-scroll-spy";
import { scrollToHeading } from "./utils/toc";

interface TableOfContentsProps {
  title: string;
}

export function TableOfContents({ title }: TableOfContentsProps) {
  const { headings, activeId, setActiveId } = useScrollSpy();

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-[120px] max-h-[calc(100vh-160px)] overflow-y-auto pr-2 select-none">
      <h4 className={cn(eyebrowClass, "mb-4")}>{title}</h4>
      <nav className="border-lip relative flex flex-col gap-1 border-l-2 font-sans">
        {headings.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToHeading(item.id);
                setActiveId(item.id);
              }}
              className={cn(
                "group relative -ml-[2px] flex flex-col justify-center rounded-r-lg border-l-2 py-1.5 no-underline transition-[color,border-color,background-color] duration-200 ease-out",
                item.level === 3 ? "pl-6 text-[12.5px]" : "pl-4 text-[13.5px]",
                isActive
                  ? "text-link border-[#0066FF] bg-[#f1f7ff] font-semibold"
                  : "text-ink-soft hover:text-ink border-transparent hover:border-[#c9d8f5] hover:bg-[#f8fafe]",
              )}
            >
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                {item.text}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
