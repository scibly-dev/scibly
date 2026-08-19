"use client";

import type { User } from "@scibly/auth";
import type { PaymentLapseCopy } from "@scibly/ee-organizations-billing/components/payment-lapse-banner";

import { PaymentLapseBanner } from "@scibly/ee-organizations-billing/components/payment-lapse-banner";
import { type Locale } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useUserSettingsStore } from "@/features/auth/client";
import { api } from "@/shared/api/trpc/client";

import {
  DesktopNavigation,
  MobileNavigation,
  ProfileTopBar,
} from "./profile-shell-navigation";
import { type Organization } from "./types";
import { useWorkspaceStore } from "./workspace-store";

export const FULL_SCREEN_SEGMENTS = [
  "editor",
  "/lessons/",
  "/notebooks",
  "/onboarding",
];

function isFullScreenRoute(pathname: string) {
  return FULL_SCREEN_SEGMENTS.some((s) => pathname.includes(s));
}

type ProfileShellProps = {
  children: React.ReactNode;
  user: Pick<User, "name" | "image" | "username">;

  paymentLapse: PaymentLapseCopy;
};

export const ProfileShell = ({
  children,
  user,
  paymentLapse,
}: ProfileShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ lang: Locale }>();
  const locale = params.lang ?? "de";

  if (isFullScreenRoute(pathname)) return <>{children}</>;

  return (
    <ProfileShellInnerComponent
      locale={locale}
      router={router}
      user={user}
      paymentLapse={paymentLapse}
    >
      {children}
    </ProfileShellInnerComponent>
  );
};

export default ProfileShell;

type InnerProps = {
  locale: Locale;
  router: ReturnType<typeof useRouter>;
  children: React.ReactNode;
  user: Pick<User, "name" | "image" | "username">;
  paymentLapse: PaymentLapseCopy;
};

function useDisplayUser(user: InnerProps["user"]) {
  const name = useUserSettingsStore((state) => state.name);
  const username = useUserSettingsStore((state) => state.username);
  const avatarUrl = useUserSettingsStore((state) => state.avatarUrl);
  return {
    displayName: username || name || user.username || user.name || "User",
    displayAvatar: avatarUrl || user.image || null,
  };
}

function useProfileShellNavigation(
  router: InnerProps["router"],
  displayName: string,
) {
  const selectPersonal = useWorkspaceStore((state) => state.selectPersonal);
  const selectOrganization = useWorkspaceStore(
    (state) => state.selectOrganization,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const orgsQuery = api.organization.listMyOrgs.useQuery();
  const organizations: Organization[] = orgsQuery.data ?? [];
  const urlOrgSlug = useParams<{ orgSlug?: string }>().orgSlug ?? null;
  const orgFromUrl = organizations.find((o) => o.slug === urlOrgSlug) ?? null;
  function handleSelectPersonal() {
    selectPersonal();
    router.push(routes.app.profile.default);
  }
  function handleSelectOrg(orgId: string) {
    const org = organizations.find((o) => o.id === orgId);
    if (!org?.slug) return;
    const role = orgsQuery.data?.find((o) => o.id === orgId)?.role ?? "member";
    selectOrganization(orgId, org.slug, role);
    router.push(routes.app.profile.org(org.slug).default(role));
  }
  const navWorkspace = orgFromUrl
    ? ({
        type: "organization",
        org: orgFromUrl,
        isCreator: orgFromUrl.role === "owner" || orgFromUrl.role === "admin",
        isOwner: orgFromUrl.role === "owner",
      } as const)
    : ({ type: "personal", userName: displayName } as const);
  const activeWorkspace = orgFromUrl
    ? ({
        type: "organization",
        orgId: orgFromUrl.id,
        slug: orgFromUrl.slug,
      } as const)
    : ({ type: "personal" } as const);
  return {
    activeWorkspace,
    // Organization creation lives in onboarding, first run or not.
    handleCreateOrg: () =>
      router.push(routes.app.profile.onboarding("create-org")),
    handleSelectOrg,
    handleSelectPersonal,
    mobileSidebarOpen,
    navWorkspace,
    organizations,
    setMobileSidebarOpen,
  };
}

export type ProfileShellController = ReturnType<
  typeof useProfileShellNavigation
>;

const ProfileShellInnerComponent = ({
  locale,
  router,
  children,
  user,
  paymentLapse,
}: InnerProps) => {
  const { displayName, displayAvatar } = useDisplayUser(user);
  const controller = useProfileShellNavigation(router, displayName);
  return (
    <div className="font-display text-ink flex h-screen w-full overflow-hidden bg-white">
      <DesktopNavigation
        controller={controller}
        locale={locale}
        displayName={displayName}
        displayAvatar={displayAvatar}
      />
      <MobileNavigation
        controller={controller}
        locale={locale}
        displayName={displayName}
        displayAvatar={displayAvatar}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProfileTopBar
          displayName={displayName}
          displayAvatar={displayAvatar}
          openMobileNavigation={() => controller.setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto bg-white">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
            {/* Shown on every org route; the grace period runs regardless. */}
            {controller.navWorkspace.type === "organization" && (
              <PaymentLapseBanner
                orgSlug={controller.navWorkspace.org.slug}
                copy={paymentLapse}
              />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
