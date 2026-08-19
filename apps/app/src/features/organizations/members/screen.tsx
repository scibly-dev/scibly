import { api, HydrateClient } from "@/shared/api/trpc/server";

import { resolveOrgScreen } from "../resolve-org-screen";
import { MembersListComponent } from "./components/members-list";
import { MEMBERS_PAGE_SIZE } from "./constants";

export async function OrganizationMembersScreen(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  const { lang, orgSlug } = await props.params;
  const { dict, org } = await resolveOrgScreen(lang, orgSlug);
  const t = dict.orgMembers;

  void api.organization.listMembersAndInvitations.prefetchInfinite({
    organizationId: org.id,
    limit: MEMBERS_PAGE_SIZE,
    search: "",
    role: "all",
    status: "all",
  });

  return (
    <HydrateClient>
      <div className="flex w-full flex-col gap-8 pb-20">
        <div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-2 text-[15px]">{t.subtitle}</p>
        </div>
        <MembersListComponent t={t} orgId={org.id} />
      </div>
    </HydrateClient>
  );
}
