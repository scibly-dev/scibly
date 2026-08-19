"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../i18n/notebook.types";

import { formatChatDate } from "@scibly/lib";
import { routes } from "@scibly/routes";
import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Menu, PanelLeft, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { api } from "@/shared/api/trpc/client";

import { CreatorSidebar } from "../workspace/components/creator-sidebar";
import {
  notebookAppFrame,
  notebookCanvas,
  notebookHeaderBar,
  notebookIconButton,
  notebookListHover,
  notebookShell,
  notebookShellPadding,
} from "../workspace/components/notebook-shell";
import { useSidebarState } from "../workspace/hooks/use-sidebar-state";

interface HistoryWorkspaceProps {
  lang: string;
  orgSlug: string;
  t: NotebookTranslations;
}

export const NotebookResults = ({
  notebooks,
  isLoading,
  orgSlug,
  lang,
  empty,
}: {
  notebooks: RouterOutputs["notebook"]["list"];
  isLoading: boolean;
  orgSlug: string;
  lang: string;
  empty: string;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-ground h-12 animate-pulse rounded-lg dark:bg-neutral-900"
          />
        ))}
      </div>
    );
  }
  if (notebooks.length === 0)
    return (
      <p className="text-ink-faint py-16 text-center text-[15px]">{empty}</p>
    );
  return (
    <div className="flex flex-col">
      {notebooks.map((notebook) => (
        <Link
          key={notebook.id}
          href={routes.app.profile.org(orgSlug).notebook.detail(notebook.id)}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-3 transition-colors",
            notebookListHover,
          )}
        >
          <span className="text-ink truncate text-[15px] font-medium dark:text-neutral-300">
            {notebook.title}
          </span>
          <span className="text-ink-faint ml-4 shrink-0 text-[13px]">
            {formatChatDate(notebook.updatedAt, lang)}
          </span>
        </Link>
      ))}
    </div>
  );
};

export const HistoryHeader = ({
  title,
  sidebarOpen,
  onMobileOpen,
  onDesktopOpen,
}: {
  title: string;
  sidebarOpen: boolean;
  onMobileOpen: () => void;
  onDesktopOpen: () => void;
}) => {
  const iconClass = cn(
    "flex h-8 w-8 items-center justify-center rounded-lg",
    notebookIconButton,
  );
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center px-4 md:px-6",
        notebookHeaderBar,
      )}
    >
      {!sidebarOpen ? (
        <>
          <button
            onClick={onMobileOpen}
            type="button"
            className={cn(iconClass, "md:hidden")}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={onDesktopOpen}
            type="button"
            className={cn(iconClass, "hidden md:flex")}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </>
      ) : null}
      <h1 className="text-ink text-[15px] font-semibold dark:text-neutral-50">
        {title}
      </h1>
    </div>
  );
};

export function HistoryWorkspace({ lang, orgSlug, t }: HistoryWorkspaceProps) {
  const {
    mobileLeftOpen: mobileSidebarOpen,
    setMobileLeftOpen: setMobileSidebarOpen,
    desktopLeftOpen: desktopSidebarOpen,
    setDesktopLeftOpen: setDesktopSidebarOpen,
  } = useSidebarState();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notebooks = [], isLoading } = api.notebook.list.useQuery({
    orgSlug,
  });

  const filteredNotebooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notebooks;
    return notebooks.filter((notebook) =>
      notebook.title.toLowerCase().includes(query),
    );
  }, [notebooks, searchQuery]);

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden",
        notebookShell,
        notebookShellPadding,
      )}
    >
      <div className={notebookAppFrame}>
        <CreatorSidebar
          orgSlug={orgSlug}
          t={t}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          desktopOpen={desktopSidebarOpen}
          onDesktopOpenChange={setDesktopSidebarOpen}
        />

        <div className={cn("flex min-w-0 flex-1 flex-col", notebookCanvas)}>
          <HistoryHeader
            title={t.page.recentsHeader}
            sidebarOpen={desktopSidebarOpen}
            onMobileOpen={() => setMobileSidebarOpen(true)}
            onDesktopOpen={() => setDesktopSidebarOpen(true)}
          />

          <div className="flex flex-1 flex-col items-center overflow-hidden px-6 pt-6 pb-10">
            <div className="flex h-full w-full max-w-xl flex-col gap-6 overflow-hidden">
              <div className="relative w-full shrink-0">
                <Search className="text-ink-faint absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.page.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full rounded-xl py-3 pr-4 pl-11 text-[15px]",
                    fieldClass,
                    "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-500 dark:shadow-none",
                  )}
                />
              </div>

              <div className="no-scrollbar flex-1 overflow-y-auto">
                <NotebookResults
                  notebooks={filteredNotebooks}
                  isLoading={isLoading}
                  orgSlug={orgSlug}
                  lang={lang}
                  empty={t.page.noChats}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
