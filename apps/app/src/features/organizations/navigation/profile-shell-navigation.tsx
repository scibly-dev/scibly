"use client";

import type { Locale } from "@scibly/i18n/constants";
import type { ProfileShellController } from "./profile-shell";

import { signOut } from "@scibly/auth/client";
import { getInitials } from "@scibly/lib";
import { usePostHog } from "@scibly/observability/client";
import { routes } from "@scibly/routes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import LanguageSwitcher from "@scibly/ui/components/language-switcher";
import { Sheet, SheetContent } from "@scibly/ui/components/sheet";
import { LogOut, Menu } from "lucide-react";
import Link from "next/link";

import NavSidebar from "./nav-sidebar";
import WorkspaceRail from "./workspace-rail";

type NavigationProps = {
  controller: ProfileShellController;
  locale: Locale;
  displayName: string;
  displayAvatar: string | null;
};

export function DesktopNavigation({
  controller,
  locale,
  displayName,
  displayAvatar,
}: NavigationProps) {
  return (
    <div className="hidden h-full shrink-0 md:flex">
      <WorkspaceRail
        userName={displayName}
        userImage={displayAvatar}
        organizations={controller.organizations}
        activeWorkspace={controller.activeWorkspace}
        onSelectPersonal={controller.handleSelectPersonal}
        onSelectOrg={controller.handleSelectOrg}
        onCreateOrg={controller.handleCreateOrg}
      />
      <NavSidebar locale={locale} workspace={controller.navWorkspace} />
    </div>
  );
}

export function MobileNavigation({
  controller,
  locale,
  displayName,
  displayAvatar,
}: NavigationProps) {
  return (
    <Sheet
      open={controller.mobileSidebarOpen}
      onOpenChange={controller.setMobileSidebarOpen}
    >
      <SheetContent
        side="left"
        className="w-[280px] border-r-0 p-0 sm:max-w-[280px] [&>button]:hidden"
      >
        <div className="flex h-full">
          <WorkspaceRail
            userName={displayName}
            userImage={displayAvatar}
            organizations={controller.organizations}
            activeWorkspace={controller.activeWorkspace}
            onSelectPersonal={() => {
              controller.setMobileSidebarOpen(false);
              controller.handleSelectPersonal();
            }}
            onSelectOrg={(orgId) => {
              controller.setMobileSidebarOpen(false);
              controller.handleSelectOrg(orgId);
            }}
            onCreateOrg={() => {
              controller.setMobileSidebarOpen(false);
              controller.handleCreateOrg();
            }}
          />
          <NavSidebar
            locale={locale}
            workspace={controller.navWorkspace}
            onItemClick={() => controller.setMobileSidebarOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProfileTopBar({
  displayName,
  displayAvatar,
  openMobileNavigation,
}: {
  displayName: string;
  displayAvatar: string | null;
  openMobileNavigation: () => void;
}) {
  const posthog = usePostHog();

  return (
    <div className="border-hairline flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 md:px-8">
      <div className="flex items-center gap-2">
        <button
          onClick={openMobileNavigation}
          className="text-ink-soft hover:bg-ink/[0.05] hover:text-ink flex h-9 w-9 items-center justify-center rounded-xl transition-colors md:hidden"
          aria-label="Menü öffnen"
          title="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Link
          href={routes.app.profile.userSettings}
          className="text-ink-muted hover:bg-ink/[0.05] hover:text-ink flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm no-underline transition-colors"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={displayAvatar ?? undefined} alt="User avatar" />
            <AvatarFallback className="bg-ground text-ink-muted text-[10px]">
              {getInitials(displayName)[0]}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate font-medium">
            {displayName}
          </span>
        </Link>
        <button
          onClick={async () => {
            await signOut();
            // PostHog does not infer identity from the session ending, and reset() also wipes its own consent record — restored below from our consent cookie.
            posthog.reset();
            window.location.href = routes.app.auth.default;
          }}
          className="text-ink-faint hover:bg-ink/[0.05] hover:text-ink rounded-xl p-1.5 transition-colors"
          aria-label="Abmelden"
          title="Abmelden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
