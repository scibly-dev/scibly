"use client";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { useCurrentEditor } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import EditorTitle from "@/features/course-authoring/scenes/editor/toolbar/editor-title";
export const TopBar = memo(() => {
  const { editor: currentEditor } = useCurrentEditor();

  if (!currentEditor) return null;

  const getBackUrl = () => {
    return routes.web.base.home;
  };

  const backUrl = getBackUrl();

  return (
    <div className="border-hairline text-ink fixed z-50 flex w-full items-center justify-between border-b-2 bg-white px-3 py-2 md:px-10 md:py-3 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
      <span className="flex shrink-0 items-center gap-2 md:gap-4">
        {backUrl && (
          <Link href={backUrl}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </span>
      <EditorTitle editor={currentEditor} />
      <div className="flex shrink-0 items-center justify-center">
        <div className="flex items-center gap-1 pl-1 md:gap-2 md:pl-2"></div>
      </div>
    </div>
  );
});

TopBar.displayName = "TopBar";
export default TopBar;
