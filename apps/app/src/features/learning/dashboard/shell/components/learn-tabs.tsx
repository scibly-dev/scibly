"use client";

import { routes } from "@scibly/routes";
import { cn } from "@scibly/ui/utils";
import { Award, BookOpen, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { useTranslation } from "@/i18n/hooks/use-translation";

const TABS = [
  {
    key: "overview" as const,
    icon: LayoutDashboard,
    href: (slug: string) => routes.app.profile.org(slug).learn.root,

    isActive: (pathname: string, slug: string) =>
      new URL(routes.app.profile.org(slug).learn.root).pathname === pathname ||
      pathname.endsWith(`/learn`),
  },
  {
    key: "myCourses" as const,
    icon: BookOpen,
    href: (slug: string) => routes.app.profile.org(slug).learn.courses,
    isActive: (pathname: string, slug: string) =>
      pathname.includes(
        new URL(routes.app.profile.org(slug).learn.courses).pathname,
      ),
  },
  {
    key: "certificates" as const,
    icon: Award,
    href: (slug: string) => routes.app.profile.org(slug).learn.certificates,
    isActive: (pathname: string, slug: string) =>
      pathname.includes(
        new URL(routes.app.profile.org(slug).learn.certificates).pathname,
      ),
  },
] as const;

export default function LearnTabs() {
  const pathname = usePathname();
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const { translations } = useTranslation("learn");
  const t = translations.tabs;

  return (
    <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {TABS.map((tab) => {
        const active = tab.isActive(pathname, orgSlug);
        return (
          <Link
            key={tab.key}
            href={tab.href(orgSlug)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {t[tab.key]}
          </Link>
        );
      })}
    </div>
  );
}
