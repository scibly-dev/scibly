import type { Metadata } from "next";

import { getLocale } from "@scibly/i18n";
import { constructMetadata } from "@scibly/lib";

import { oEmbedDiscoveryUrl } from "@/features/learning/embed-course/oembed";
import { PublicCourseScreen } from "@/features/learning/public-course/screen";
import { getFullDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(props: {
  params: Promise<{ lang: string; courseId: string }>;
}): Promise<Metadata> {
  const { lang, courseId } = await props.params;
  const dict = await getFullDictionary(lang);
  return constructMetadata({
    title: dict.publicCourse.metadata.title,
    description: dict.publicCourse.metadata.description,

    alternateTypes: { "application/json+oembed": oEmbedDiscoveryUrl(courseId) },
    locale: getLocale(lang, true),
  });
}

export default function PublicCoursePage(props: {
  params: Promise<{ lang: string; courseId: string }>;
}) {
  return <PublicCourseScreen params={props.params} />;
}
