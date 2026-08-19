import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { api, HydrateClient } from "@/shared/api/trpc/server";

import DashboardOverview from "./components";

export async function LearningOverviewScreen({ orgSlug }: { orgSlug: string }) {
  const session = await getSession();
  if (!session?.user) return redirect(routes.app.auth.default);

  void api.learning.getDashboardStats.prefetch({ orgSlug });
  return (
    <HydrateClient>
      <DashboardOverview orgSlug={orgSlug} />
    </HydrateClient>
  );
}
