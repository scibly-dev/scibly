"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { Edit2, FileText, Menu, PanelLeft, PanelRight } from "lucide-react";
import { useState } from "react";

import { notebookHeaderBar, notebookIconButton } from "./notebook-shell";

const workspaceIconButtonClass = cn(
  "flex h-8 w-8 items-center justify-center rounded-lg",
  notebookIconButton,
);

interface WorkspaceHeaderProps {
  t: NotebookTranslations;
  notebookTitle?: string;
  initialTitle?: string;
  onUpdateTitle?: (title: string) => void;
  hasChats?: boolean;
  onMenuClick?: () => void;
  desktopSidebarOpen?: boolean;
  onDesktopMenuClick?: () => void;
  rightSidebarOpen?: boolean;
  onRightMenuClick?: () => void;
  onDesktopRightMenuClick?: () => void;

  accessory?: React.ReactNode;
}

export const SidebarControls = ({
  visible,
  className,
  onMobile,
  onDesktop,
}: {
  visible: boolean;
  className: string;
  onMobile?: () => void;
  onDesktop?: () => void;
}) => {
  if (!visible) return null;
  return (
    <>
      <button
        onClick={onMobile}
        type="button"
        className={cn(className, "md:hidden")}
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>
      <button
        onClick={onDesktop}
        type="button"
        className={cn(className, "hidden md:flex")}
        aria-label="Expand sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </button>
    </>
  );
};

export const PanelControls = ({
  visible,
  className,
  onMobile,
  onDesktop,
}: {
  visible: boolean;
  className: string;
  onMobile?: () => void;
  onDesktop?: () => void;
}) => {
  if (!visible) return null;
  return (
    <>
      <button
        onClick={onMobile}
        type="button"
        className={cn(className, "md:hidden")}
        aria-label="Open panel"
      >
        <FileText className="h-4 w-4" />
      </button>
      <button
        onClick={onDesktop}
        type="button"
        className={cn(className, "hidden md:flex")}
        aria-label="Expand panel"
      >
        <PanelRight className="h-4 w-4" />
      </button>
    </>
  );
};

interface TitleControlProps {
  isEditing: boolean;
  title: string;
  fallback: string;
  onStartEditing: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const TitleControl = (props: TitleControlProps) => {
  if (props.isEditing) {
    return (
      <input
        autoFocus
        className="border-edge text-ink w-full max-w-xs border-b-2 bg-transparent px-1 py-0.5 text-[15px] font-semibold focus:border-[#0066ff] focus:outline-none dark:border-neutral-600 dark:text-neutral-100"
        onBlur={props.onSave}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") props.onSave();
          if (event.key === "Escape") props.onCancel();
        }}
        type="text"
        value={props.title}
      />
    );
  }
  return (
    <button
      className="text-ink hover:text-ink-muted group flex max-w-xs items-center gap-1.5 text-[15px] font-semibold transition-colors dark:text-neutral-50 dark:hover:text-neutral-200"
      onClick={props.onStartEditing}
      type="button"
    >
      <span className="truncate">{props.title || props.fallback}</span>
      {props.title ? (
        <Edit2 className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
      ) : null}
    </button>
  );
};

export const EmptyWorkspaceHeader = ({
  title,
  iconClass,
  desktopSidebarOpen,
  onMenuClick,
  onDesktopMenuClick,
  rightSidebarOpen,
  onRightMenuClick,
  onDesktopRightMenuClick,
  accessory,
}: {
  title: string;
  iconClass: string;
} & Pick<
  WorkspaceHeaderProps,
  | "desktopSidebarOpen"
  | "onMenuClick"
  | "onDesktopMenuClick"
  | "rightSidebarOpen"
  | "onRightMenuClick"
  | "onDesktopRightMenuClick"
  | "accessory"
>) => {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between px-4 md:px-6",
        notebookHeaderBar,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarControls
          visible={!desktopSidebarOpen}
          className={iconClass}
          onMobile={onMenuClick}
          onDesktop={onDesktopMenuClick}
        />
        <span className="text-ink text-[15px] font-semibold dark:text-neutral-50">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {accessory}
        <PanelControls
          visible={!rightSidebarOpen}
          className={iconClass}
          onMobile={onRightMenuClick}
          onDesktop={onDesktopRightMenuClick}
        />
      </div>
    </div>
  );
};

function useEditableTitle(
  notebookTitle: string | undefined,
  onUpdateTitle?: (title: string) => void,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [prevTitle, setPrevTitle] = useState(notebookTitle || "");
  const [tempTitle, setTempTitle] = useState(notebookTitle || "");
  const currentTitle = notebookTitle || "";
  if (currentTitle !== prevTitle) {
    setPrevTitle(currentTitle);
    setTempTitle(currentTitle);
  }
  const save = () => {
    setIsEditing(false);
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== notebookTitle) onUpdateTitle?.(trimmed);
    else setTempTitle(notebookTitle || "");
  };
  const cancel = () => {
    setIsEditing(false);
    setTempTitle(notebookTitle || "");
  };
  return { isEditing, setIsEditing, tempTitle, setTempTitle, save, cancel };
}

export function WorkspaceHeader({
  t,
  notebookTitle,
  initialTitle,
  onUpdateTitle,
  hasChats = false,
  onMenuClick,
  desktopSidebarOpen = true,
  onDesktopMenuClick,
  rightSidebarOpen = true,
  onRightMenuClick,
  onDesktopRightMenuClick,
  accessory,
}: WorkspaceHeaderProps) {
  const titleState = useEditableTitle(notebookTitle, onUpdateTitle);

  const showCollapsedControls =
    !desktopSidebarOpen || !rightSidebarOpen || !hasChats;

  if (!hasChats) {
    return (
      <EmptyWorkspaceHeader
        title={initialTitle ?? t.page.newNotebook}
        iconClass={workspaceIconButtonClass}
        desktopSidebarOpen={desktopSidebarOpen}
        onMenuClick={onMenuClick}
        onDesktopMenuClick={onDesktopMenuClick}
        rightSidebarOpen={rightSidebarOpen}
        onRightMenuClick={onRightMenuClick}
        onDesktopRightMenuClick={onDesktopRightMenuClick}
        accessory={accessory}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between px-4 md:px-6",
        notebookHeaderBar,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <SidebarControls
          visible={showCollapsedControls && !desktopSidebarOpen}
          className={workspaceIconButtonClass}
          onMobile={onMenuClick}
          onDesktop={onDesktopMenuClick}
        />
        <TitleControl
          isEditing={titleState.isEditing}
          title={titleState.tempTitle}
          fallback={t.page.newNotebook}
          onStartEditing={() => {
            if (notebookTitle) titleState.setIsEditing(true);
          }}
          onChange={titleState.setTempTitle}
          onSave={titleState.save}
          onCancel={titleState.cancel}
        />
      </div>

      <div className="flex items-center gap-1">
        {accessory}
        <PanelControls
          visible={showCollapsedControls && !rightSidebarOpen}
          className={workspaceIconButtonClass}
          onMobile={onRightMenuClick}
          onDesktop={onDesktopRightMenuClick}
        />
      </div>
    </div>
  );
}
