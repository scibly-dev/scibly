import { hasAppErrorCode } from "@scibly/api/application-error";
import { getSession } from "@scibly/auth/session";
import { getFirstName } from "@scibly/lib";
import { INITIAL_MESSAGE_QUERY_PARAM, routes } from "@scibly/routes";
import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { notFound, redirect } from "next/navigation";

import { pickGreeting } from "@/features/notebook/chat/welcome-messages";
import { ProductionNotebookWorkspace } from "@/features/notebook/workspace/components/notebook-workspace";
import { getDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

export default async function NotebookPage(props: {
  params: Promise<{ lang: string; orgSlug: string; notebookId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { lang, orgSlug, notebookId } = await props.params;
  const searchParams = await props.searchParams;
  const initialMessage = searchParams[INITIAL_MESSAGE_QUERY_PARAM];
  const session = await getSession();

  if (!session?.user) {
    return redirect(routes.app.auth.default);
  }

  const [t] = await Promise.all([
    getDictionary(lang, "notebook"),
    (async () => {
      try {
        await Promise.all([
          api.notebook.getById.prefetch({ orgSlug, notebookId }),
          api.notebook.getMeta.prefetch({ orgSlug, notebookId }),
        ]);
      } catch (error) {
        if (hasAppErrorCode(error, "NOT_FOUND", "FORBIDDEN")) {
          notFound();
        }
        throw error;
      }
    })(),
  ]);

  const displayName = session.user.username || getFirstName(session.user.name);
  const greeting = pickGreeting(t, displayName);

  return (
    <HydrateClient>
      <ErrorBoundaryWrapper>
        <ProductionNotebookWorkspace
          greeting={greeting}
          initialMessage={initialMessage}
          notebookId={notebookId}
          orgSlug={orgSlug}
          t={t}
        />
      </ErrorBoundaryWrapper>
    </HydrateClient>
  );
}
