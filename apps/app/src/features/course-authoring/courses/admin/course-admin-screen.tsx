import { hasAppErrorCode } from "@scibly/api/application-error";
import { routes } from "@scibly/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@scibly/ui/components/breadcrumb";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { CourseOutdatedAlert } from "../../scenes/review/components/course-outdated-alert";
import { CourseAdminHero } from "./components/course-admin-hero";
import { CourseAdminTabs } from "./components/course-admin-tabs";

async function loadCourseAdminScreenData(courseId: string, lang: string) {
  void api.course.listEnrollments.prefetch({
    courseId,
    limit: 10,
    cursor: 0,
    search: "",
    status: "all",
  });
  void api.course.getOutdatedScenes.prefetch({ courseId });

  const [course, dict] = await Promise.all([
    api.course.getById({ courseId }),
    getFullDictionary(lang),
    api.course.getById.prefetch({ courseId }),
    api.course.listLessons.prefetch({ courseId, limit: 100 }),
  ]);

  return { course, dict };
}

export async function CourseAdminScreen({
  lang,
  orgSlug,
  courseId,
}: {
  lang: string;
  orgSlug: string;
  courseId: string;
}) {
  let data: Awaited<ReturnType<typeof loadCourseAdminScreenData>>;
  try {
    data = await loadCourseAdminScreenData(courseId, lang);
  } catch (error) {
    if (hasAppErrorCode(error, "NOT_FOUND")) {
      notFound();
    }
    throw error;
  }

  const t = data.dict.courses;

  return (
    <HydrateClient>
      <div className="flex w-full flex-col gap-8 pb-20">
        <div className="-mb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={routes.app.profile.org(orgSlug).courses.root}>
                    {t.detail.breadcrumbRoot}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{data.course.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <CourseAdminHero courseId={courseId} orgSlug={orgSlug} />

        <CourseOutdatedAlert
          courseId={courseId}
          courseTitle={data.course.title}
          orgSlug={orgSlug}
        />

        <CourseAdminTabs courseId={courseId} orgSlug={orgSlug} />
      </div>
    </HydrateClient>
  );
}
