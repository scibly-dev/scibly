"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { routes } from "@scibly/routes";
import { usePathname } from "next/navigation";

import { api } from "@/shared/api/trpc/client";

import { CollapsibleSidebar } from "./collapsible-sidebar";
import { CreatorSidebarContent } from "./creator-sidebar-content";

const RECENT_NOTEBOOK_LIMIT = 10;
export const SIDEBAR_WIDTH = 260;

export type SidebarNotebook = { id: string; title: string };
export type SidebarTarget =
  | { kind: "link"; href: string }
  | { kind: "disabled"; description?: string };
type SidebarBrand =
  | { kind: "logo"; href: string }
  | { kind: "label"; text: string };
type SidebarNewChatTarget =
  | { kind: "client"; href: string }
  | { kind: "native"; href: string };

export interface CreatorSidebarViewProps {
  t: NotebookTranslations;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopOpen?: boolean;
  onDesktopOpenChange?: (open: boolean) => void;
  onNewChat?: () => void;
  notebooks: readonly SidebarNotebook[];
  isNotebooksLoading: boolean;
  currentNotebookId?: string;
  isNewNotebookActive: boolean;
  isHistoryActive: boolean;
  brand: SidebarBrand;
  leaveHref: string;
  newChatTarget: SidebarNewChatTarget;
  historyTarget: SidebarTarget;
  notebookTarget: (notebookId: string) => SidebarTarget;
}

export const CreatorSidebarView = (props: CreatorSidebarViewProps) => (
  <CollapsibleSidebar
    side="left"
    width={SIDEBAR_WIDTH}
    desktopOpen={props.desktopOpen ?? true}
    mobileOpen={props.mobileOpen}
    onMobileOpenChange={props.onMobileOpenChange}
  >
    <CreatorSidebarContent props={props} />
  </CollapsibleSidebar>
);

interface CreatorSidebarProps {
  orgSlug: string;
  t: NotebookTranslations;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopOpen?: boolean;
  onDesktopOpenChange?: (open: boolean) => void;
  onNewChat?: () => void;
}

export function CreatorSidebar({ orgSlug, ...props }: CreatorSidebarProps) {
  const pathname = usePathname();
  const orgRoutes = routes.app.profile.org(orgSlug);
  const notebookRoot = new URL(orgRoutes.notebook.root).pathname;
  const notebookHistory = new URL(orgRoutes.notebook.history).pathname;
  const segments = pathname.split("/");
  const notebookIndex = segments.indexOf("notebook");
  const nextSegment =
    notebookIndex >= 0 ? segments[notebookIndex + 1] : undefined;
  const currentNotebookId =
    nextSegment && nextSegment !== "history" ? nextSegment : undefined;
  const { data: notebooks = [], isLoading } = api.notebook.list.useQuery({
    orgSlug,
  });

  return (
    <CreatorSidebarView
      {...props}
      notebooks={notebooks.slice(0, RECENT_NOTEBOOK_LIMIT)}
      isNotebooksLoading={isLoading}
      currentNotebookId={currentNotebookId}
      isNewNotebookActive={pathname.endsWith(notebookRoot)}
      isHistoryActive={pathname.includes(notebookHistory)}
      brand={{ kind: "logo", href: orgRoutes.dashboard }}
      leaveHref={orgRoutes.dashboard}
      newChatTarget={{ kind: "client", href: orgRoutes.notebook.root }}
      historyTarget={{ kind: "link", href: orgRoutes.notebook.history }}
      notebookTarget={(notebookId) => ({
        kind: "link",
        href: orgRoutes.notebook.detail(notebookId),
      })}
    />
  );
}
