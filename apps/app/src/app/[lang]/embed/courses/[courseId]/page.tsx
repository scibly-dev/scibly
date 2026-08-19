import type { Metadata } from "next";

import { getLocale } from "@scibly/i18n";
import { constructMetadata } from "@scibly/lib";
import { routes } from "@scibly/routes";
import { Suspense } from "react";

import { CoursePlayerLoading } from "@/features/learning/course-player/ui/player/course-overview/overview-skeleton";
import { EmbedCourseScreen } from "@/features/learning/embed-course/screen";
import { getFullDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(props: {
  params: Promise<{ lang: string; courseId: string }>;
}): Promise<Metadata> {
  const { lang, courseId } = await props.params;
  const dict = await getFullDictionary(lang);
  return constructMetadata({
    title: dict.publicCourse.metadata.title,
    description: dict.publicCourse.metadata.description,

    noIndex: true,
    canonicalUrl: routes.app.public.course(courseId),
    locale: getLocale(lang, true),
  });
}

export default function EmbedCoursePage(props: {
  params: Promise<{ lang: string; courseId: string }>;
}) {
  return (
    <main className="w-full">
      {/* Until the request's course id and referrer resolve. */}
      <Suspense fallback={<CoursePlayerLoading />}>
        <EmbedCourseScreen params={props.params} />
      </Suspense>
    </main>
  );
}
