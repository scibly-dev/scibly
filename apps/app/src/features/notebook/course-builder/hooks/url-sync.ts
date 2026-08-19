import { routes } from "@scibly/routes";

// Uses replaceState instead of a Next.js navigation, which would interrupt
// streaming responses still in flight.
export function syncNotebookUrl(orgSlug: string, notebookId: string): void {
  const pathname = new URL(
    routes.app.profile.org(orgSlug).notebook.detail(notebookId),
  ).pathname;
  window.history.replaceState(null, "", pathname);
}
