import { cn } from "@scibly/ui/utils";

interface CoursePublishStatusBadgeProps {
  latestPublishedVersion: { version: number } | null;
  draftVersion?: number;
  t: {
    publishStatus: {
      publishedShort: string;
      unpublishedShort: string;
    };
  };
  className?: string;
}

export function CoursePublishStatusBadge({
  latestPublishedVersion,
  draftVersion,
  t,
  className,
}: CoursePublishStatusBadgeProps) {
  const isPublished = latestPublishedVersion != null;
  const label = isPublished
    ? t.publishStatus.publishedShort.replace(
        "{{version}}",
        String(latestPublishedVersion.version),
      )
    : t.publishStatus.unpublishedShort.replace(
        "{{version}}",
        String(draftVersion ?? 1),
      );

  return (
    <span
      className={cn(
        "text-ink-soft inline-flex items-center gap-1.5 text-[11px] font-semibold",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full ring-2",
          isPublished
            ? "bg-green-500 ring-green-200"
            : "bg-ink-faint ring-hairline",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
