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

interface PreviewBreadcrumbProps {
  orgSlug: string;
  courseId: string;
  courseTitle: string;
}

export function PreviewBreadcrumb({
  orgSlug,
  courseId,
  courseTitle,
}: PreviewBreadcrumbProps) {
  return (
    <div className="-mb-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={routes.app.profile.org(orgSlug).courses.root}>
                Programmes
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={routes.app.profile.org(orgSlug).courses.detail(courseId)}
              >
                {courseTitle}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Preview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
