import { pageTitleClass, subtitleClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import React from "react";

interface BlogHeaderProps {
  title: string;
  subtitle: string;
}

export function BlogHeader({ title, subtitle }: BlogHeaderProps) {
  return (
    <div className="mb-11 flex flex-col items-center text-center">
      <h1 className={pageTitleClass}>{title}</h1>
      <p className={cn(subtitleClass, "mt-5 max-w-[560px]")}>{subtitle}</p>
    </div>
  );
}
