"use client";

import { type Locale } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";
import { cn } from "@scibly/ui/utils";
import {
  Award,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

import { type Organization } from "./types";

const NavItemBody = ({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) => {
  const { pending } = useLinkStatus();
  const isHighlighted = isActive || pending;
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition-colors duration-150",
        isHighlighted
          ? "bg-[#b9d7ff] font-semibold text-[#0b4fb0] shadow-[inset_0_-1.5px_0_rgba(23,83,156,0.16)]"
          : "text-ink-muted hover:bg-ink/[0.05] hover:text-ink font-medium",
      )}
    >
      <span
        className={cn(
          "shrink-0",
          isHighlighted ? "text-[#0b4fb0]" : "text-ink-faint",
        )}
      >
        {item.icon}
      </span>
      {item.label}
    </span>
  );
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const getPersonalNavGroups = (locale: Locale): NavGroup[] => [
  {
    label: locale === "de" ? "Konto" : "Account",
    items: [
      {
        label: locale === "de" ? "Einstellungen" : "Settings",
        href: routes.app.profile.userSettings,
        icon: <Settings className="h-4 w-4" />,
      },
      {
        label: locale === "de" ? "Einladungen" : "Invitations",
        href: routes.app.profile.invitations(),
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
];

const getOrgNavGroups = (
  locale: Locale,
  slug: string,
  isCreator: boolean,
  isOwner: boolean,
): NavGroup[] => {
  const orgRoutes = routes.app.profile.org(slug);

  if (!isCreator) {
    return [
      {
        label: locale === "de" ? "Lernbereich" : "Learning",
        items: [
          {
            label: "Dashboard",
            href: orgRoutes.dashboard,
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            label: locale === "de" ? "Meine Kurse" : "My Courses",
            href: orgRoutes.learn.courses,
            icon: <BookOpen className="h-4 w-4" />,
          },
          {
            label: locale === "de" ? "Zertifikate" : "Certificates",
            href: orgRoutes.learn.certificates,
            icon: <Award className="h-4 w-4" />,
          },
        ],
      },
    ];
  }

  return [
    {
      label: locale === "de" ? "Inhalte" : "Content",
      items: [
        {
          label: locale === "de" ? "Kurse" : "Courses",
          href: orgRoutes.courses.root,
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          label: "Notebook",
          href: orgRoutes.notebook.root,
          icon: <Sparkles className="h-4 w-4" />,
        },
      ],
    },
    {
      label: locale === "de" ? "Lernbereich" : "Learning",
      items: [
        {
          label: "Dashboard",
          href: orgRoutes.dashboard,
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
      ],
    },
    {
      label: locale === "de" ? "Organisation" : "Organization",
      items: [
        {
          label: locale === "de" ? "Mitglieder" : "Members",
          href: orgRoutes.members.root,
          icon: <Users className="h-4 w-4" />,
        },

        ...(isOwner
          ? [
              {
                label: locale === "de" ? "Abrechnung" : "Billing",
                href: orgRoutes.billing,
                icon: <CreditCard className="h-4 w-4" />,
              },
            ]
          : []),
        {
          label: locale === "de" ? "Einstellungen" : "Settings",
          href: orgRoutes.settings,
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];
};

type NavSidebarProps = {
  locale: Locale;
  workspace:
    | { type: "personal"; userName: string }
    | {
        type: "organization";
        org: Organization;
        isCreator: boolean;
        isOwner: boolean;
      };
  onItemClick?: () => void;
};

export const NavSidebar = memo(
  ({ locale, workspace, onItemClick }: NavSidebarProps) => {
    const pathname = usePathname();

    const navGroups =
      workspace.type === "personal"
        ? getPersonalNavGroups(locale)
        : getOrgNavGroups(
            locale,
            workspace.org.slug!,
            workspace.isCreator,
            workspace.isOwner,
          );

    const workspaceLabel =
      workspace.type === "personal" ? workspace.userName : workspace.org.name;

    const workspaceSubtitle =
      workspace.type === "personal"
        ? locale === "de"
          ? "Persönlicher Bereich"
          : "Personal workspace"
        : locale === "de"
          ? "Organisation"
          : "Organization";

    return (
      <div className="border-hairline flex h-full w-[220px] flex-col border-r bg-white">
        {/* Workspace header */}
        <div className="border-hairline border-b px-4 py-5">
          <h2 className="text-ink truncate text-sm font-semibold tracking-[-0.01em]">
            {workspaceLabel}
          </h2>
          <p className="text-ink-soft mt-0.5 text-xs">{workspaceSubtitle}</p>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group, groupIdx) => (
            <div key={group.label} className={cn(groupIdx > 0 && "mt-6")}>
              <p className="text-ink-faint mb-2 px-2 text-[11px] font-semibold tracking-wider uppercase">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname.includes(
                    new URL(item.href).pathname,
                  );
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className="block text-[13px] no-underline"
                    >
                      <NavItemBody item={item} isActive={isActive} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    );
  },
);

NavSidebar.displayName = "NavSidebar";
export default NavSidebar;
