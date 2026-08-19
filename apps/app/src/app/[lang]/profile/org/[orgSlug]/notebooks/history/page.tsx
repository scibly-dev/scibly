import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { HistoryWorkspace } from "@/features/notebook/history/history-workspace";
import { getDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

export default async function NotebookHistoryPage(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  const { lang, orgSlug } = await props.params;
  const session = await getSession();

  if (!session?.user) {
    return redirect(routes.app.auth.default);
  }

  void api.notebook.list.prefetch({ orgSlug });

  const t = await getDictionary(lang, "notebook");

  return (
    <HydrateClient>
      <HistoryWorkspace lang={lang} orgSlug={orgSlug} t={t} />
    </HydrateClient>
  );
}
