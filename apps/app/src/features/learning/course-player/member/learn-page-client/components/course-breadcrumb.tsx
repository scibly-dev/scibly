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

interface CourseBreadcrumbProps {
  orgSlug: string;
  courseTitle: string;
}

export function CourseBreadcrumb({
  orgSlug,
  courseTitle,
}: CourseBreadcrumbProps) {
  return (
    <div className="-mb-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={routes.app.profile.org(orgSlug).dashboard}>
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{courseTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
