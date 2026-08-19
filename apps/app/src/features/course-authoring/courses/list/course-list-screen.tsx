import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { CourseList } from "./components/course-list";
import { CourseAuthoringListPage } from "./components/course-list-page";

export async function CourseListScreen({
  lang,
  orgSlug,
}: {
  lang: string;
  orgSlug: string;
}) {
  const session = await getSession();

  if (!session?.user) {
    return redirect(routes.app.auth.default);
  }

  void api.course.list
    .prefetch({
      orgSlug,
      limit: 6,
      cursor: 0,
      search: undefined,
    })
    .catch(() => undefined);

  const dict = await getFullDictionary(lang);

  const t = dict.courses;

  return (
    <HydrateClient>
      <CourseAuthoringListPage
        translations={t}
        courseList={<CourseList orgSlug={orgSlug} />}
      />
    </HydrateClient>
  );
}
