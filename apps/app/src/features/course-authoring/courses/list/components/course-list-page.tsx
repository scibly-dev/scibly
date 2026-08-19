import { type ReactNode } from "react";

import { type CoursesTranslations } from "../../../contracts";

export function CourseAuthoringListPage({
  translations,
  courseList,
}: {
  translations: CoursesTranslations;
  courseList: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-ink text-3xl font-semibold tracking-tight">
            {translations.list.title}
          </h1>
          <p className="text-ink-soft mt-2 text-[15px]">
            {translations.list.subtitle}
          </p>
        </div>
      </div>
      {courseList}
    </div>
  );
}
