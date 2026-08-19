"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import { usePathname } from "next/navigation";

import { useNotebookActions } from "@/features/notebook/chat/runtime/context";
import { CreatorSidebarView } from "@/features/notebook/workspace/components/creator-sidebar";
import { useSidebarState } from "@/features/notebook/workspace/hooks/use-sidebar-state";

import { DEMO_NOTEBOOK_ID } from "./fixture";
import { useShowcaseSnapshot } from "./showcase-runtime";

export function DemoCreatorSidebar({
  t,
  ctaHref,
}: {
  t: NotebookTranslations;
  ctaHref: string;
}) {
  const pathname = usePathname();
  const snapshot = useShowcaseSnapshot();
  const { resetChat } = useNotebookActions();
  const {
    mobileLeftOpen,
    setMobileLeftOpen,
    desktopLeftOpen,
    setDesktopLeftOpen,
  } = useSidebarState();
  const demoTranslations: NotebookTranslations = {
    ...t,
    page: {
      ...t.page,
      leaveNotebook: t.demo.backToScibly,
      newChat: t.demo.restartDemo,
    },
  };

  return (
    <CreatorSidebarView
      t={demoTranslations}
      mobileOpen={mobileLeftOpen}
      onMobileOpenChange={setMobileLeftOpen}
      desktopOpen={desktopLeftOpen}
      onDesktopOpenChange={setDesktopLeftOpen}
      onNewChat={resetChat}
      notebooks={[{ id: DEMO_NOTEBOOK_ID, title: snapshot.title }]}
      isNotebooksLoading={false}
      currentNotebookId={DEMO_NOTEBOOK_ID}
      isNewNotebookActive
      isHistoryActive={false}
      brand={{ kind: "label", text: t.demo.sidebarTitle }}
      leaveHref={ctaHref}
      newChatTarget={{ kind: "native", href: `${pathname}#restart` }}
      historyTarget={{
        kind: "disabled",
        description: t.demo.historyUnavailable,
      }}
      notebookTarget={() => ({ kind: "disabled" })}
    />
  );
}
