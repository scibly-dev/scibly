import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { PlayCircle, Share2, Upload } from "lucide-react";
import Link from "next/link";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

export function CourseHeroActions({
  courseId,
  onPublish,
  onShare,
  orgSlug,
  pending,
  t,
}: {
  courseId: string;
  onPublish: () => void;
  onShare: () => void;
  orgSlug: string;
  pending: boolean;
  t: CoursesTranslations;
}) {
  const previewHref = routes.app.profile.org(orgSlug).courses.preview(courseId);
  return (
    <>
      <div className="absolute top-6 right-6 z-30 hidden items-center gap-2 sm:flex">
        <Button variant="secondary" asChild>
          <Link href={previewHref}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {t.detail.preview}
          </Link>
        </Button>
        <Button variant="secondary" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          {t.detail.share.triggerLabel}
        </Button>
        <Button onClick={onPublish} disabled={pending}>
          <Upload className="mr-2 h-4 w-4" />
          {pending ? t.detail.publishing : t.detail.publish}
        </Button>
      </div>
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2 sm:hidden">
        <Button variant="secondary" size="icon" asChild>
          <Link href={previewHref} aria-label={t.detail.preview}>
            <PlayCircle className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={onShare}
          aria-label={t.detail.share.triggerLabel}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={onPublish}
          disabled={pending}
          aria-label={t.detail.publish}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
