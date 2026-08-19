import { getSession } from "@scibly/auth/session";
import { getFirstName } from "@scibly/lib";
import { routes } from "@scibly/routes";
import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { redirect } from "next/navigation";

import { pickGreeting } from "@/features/notebook/chat/welcome-messages";
import { ProductionNotebookWorkspace } from "@/features/notebook/workspace/components/notebook-workspace";
import { getDictionary } from "@/i18n/dictionaries";
import { HydrateClient } from "@/shared/api/trpc/server";

// The workspace creates its notebook lazily on the first message.
export default async function NotebookEntryPage(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  const { lang, orgSlug } = await props.params;
  const session = await getSession();

  if (!session?.user) {
    return redirect(routes.app.auth.clearSession);
  }

  const t = await getDictionary(lang, "notebook");
  const displayName = session.user.username || getFirstName(session.user.name);
  const greeting = pickGreeting(t, displayName);

  return (
    <HydrateClient>
      <ErrorBoundaryWrapper>
        <ProductionNotebookWorkspace
          greeting={greeting}
          orgSlug={orgSlug}
          t={t}
        />
      </ErrorBoundaryWrapper>
    </HydrateClient>
  );
}
