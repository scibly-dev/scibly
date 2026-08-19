import { keyShadowClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

interface CoursePublishStatusBadgeProps {
  latestPublishedVersion: { version: number } | null;
  draftVersion?: number;
  t: CoursesTranslations;
  variant?: "card" | "hero" | "inline";
  hasImage?: boolean;
  className?: string;
}

function statusLabel(props: CoursePublishStatusBadgeProps, subtitle = false) {
  const badgeT = props.t.list.publishStatus;
  if (props.latestPublishedVersion) {
    const template = subtitle
      ? badgeT.publishedSubtitle
      : badgeT.publishedShort;
    return template.replace(
      "{{version}}",
      String(props.latestPublishedVersion.version),
    );
  }
  const template = subtitle
    ? badgeT.unpublishedSubtitle
    : badgeT.unpublishedShort;
  return template.replace("{{version}}", String(props.draftVersion ?? 1));
}

function statusDotClass(isPublished: boolean) {
  return isPublished
    ? "bg-green-500 ring-2 ring-green-200"
    : "bg-ink-faint ring-2 ring-hairline";
}

export function CourseHeroPublishStatus(props: CoursePublishStatusBadgeProps) {
  const isPublished = props.latestPublishedVersion != null;
  return (
    <p
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 text-[13px] font-semibold",
        props.hasImage ? "text-white/70" : "text-ink-soft",
        props.className,
      )}
    >
      <span
        className={cn(
          "border-edge text-ink inline-flex items-center gap-2 rounded-full border-2 bg-white px-3 py-1",
          keyShadowClass,
        )}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            statusDotClass(isPublished),
          )}
          aria-hidden
        />
        {statusLabel(props)}
      </span>
      {statusLabel(props, true)}
    </p>
  );
}

export function CoursePublishStatusBadge({
  latestPublishedVersion,
  draftVersion,
  t,
  variant = "inline",
  hasImage = false,
  className,
}: CoursePublishStatusBadgeProps) {
  const isPublished = latestPublishedVersion != null;
  const dotClass = statusDotClass(isPublished);

  if (variant === "hero") {
    return (
      <CourseHeroPublishStatus
        latestPublishedVersion={latestPublishedVersion}
        draftVersion={draftVersion}
        t={t}
        hasImage={hasImage}
        className={className}
      />
    );
  }

  const label = statusLabel({ latestPublishedVersion, draftVersion, t });

  if (variant === "card") {
    return (
      <span
        className={cn(
          "text-ink-soft inline-flex items-center gap-1.5 text-[12px] font-semibold",
          className,
        )}
      >
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
          aria-hidden
        />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-ink-soft inline-flex items-center gap-1.5 text-[11px] font-semibold",
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
        aria-hidden
      />
      {label}
    </span>
  );
}
