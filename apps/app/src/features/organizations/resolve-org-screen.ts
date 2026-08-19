import { hasAppErrorCode } from "@scibly/api/application-error";
import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api } from "@/shared/api/trpc/server";

export async function resolveOrgScreen(lang: string, orgSlug: string) {
  const [dict, session] = await Promise.all([
    getFullDictionary(lang),
    getSession(),
  ]);

  if (!session?.user) {
    redirect(routes.app.auth.default);
  }

  try {
    return {
      dict,
      session,
      org: await api.organization.getBySlug({ slug: orgSlug }),
    };
  } catch (error) {
    if (hasAppErrorCode(error, "NOT_FOUND")) {
      redirect(routes.app.profile.default);
    }
    throw error;
  }
}
