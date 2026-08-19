import { getLocale, stripLocaleFromPathname } from "@scibly/i18n";
import { type Locale } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";

import { type EmbedSnippetInput } from "@/features/learning/contracts";

export type EmbedTarget = Pick<
  EmbedSnippetInput,
  "appOrigin" | "courseId" | "courseTitle"
> & {
  lang: Locale;
};

export interface CourseShareTarget {
  publicUrl: string;
  embed: EmbedTarget;
}

export function courseShareTarget(
  lang: string,
  course: { id: string; title: string },
): CourseShareTarget {
  const configured = new URL(routes.app.public.course(course.id));

  const appOrigin =
    typeof window === "undefined" ? configured.origin : window.location.origin;
  return {
    publicUrl: `${appOrigin}${stripLocaleFromPathname(configured.pathname)}`,
    embed: {
      appOrigin,
      courseId: course.id,
      courseTitle: course.title,
      lang: getLocale(lang, true),
    },
  };
}
