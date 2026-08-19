import { Button } from "@scibly/ui/components/button";
import { ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";

const actionClass =
  "text-ink-muted hover:text-ink h-7 rounded-[10px] text-[12px] font-semibold dark:hover:text-neutral-100";

export const PreviewHeader = ({
  onReplay,
  previewHref,
}: {
  onReplay: () => void;
  previewHref: string;
}) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-ink-faint text-[12px] font-bold tracking-wider uppercase">
          Live Preview
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild className={actionClass}>
          <Link href={previewHref} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReplay}
          className={actionClass}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Replay
        </Button>
      </div>
    </div>
  );
};
