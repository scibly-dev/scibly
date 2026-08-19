"use client";

import type {
  CreatorSidebarViewProps,
  SidebarNotebook,
  SidebarTarget,
} from "./creator-sidebar";

import Logo from "@scibly/ui/marketing/logo";
import { cn } from "@scibly/ui/utils";
import { ArrowLeft, History, PanelLeftClose, Plus } from "lucide-react";
import Link from "next/link";

import {
  notebookBorder,
  notebookIconButton,
  notebookListHover,
  notebookNavActive,
  notebookNavIdle,
  notebookPrimaryButton,
} from "./notebook-shell";

export const SidebarHeader = ({
  brand,
  labels,
  onDesktopOpenChange,
}: Pick<CreatorSidebarViewProps, "brand" | "onDesktopOpenChange"> & {
  labels: CreatorSidebarViewProps["t"]["page"];
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      {brand.kind === "logo" ? (
        <Logo
          size="small"
          className="text-ink dark:text-white"
          href={brand.href}
        />
      ) : (
        <span className="text-ink text-[13px] font-semibold dark:text-white">
          {brand.text}
        </span>
      )}
      {onDesktopOpenChange ? (
        <button
          onClick={() => onDesktopOpenChange(false)}
          type="button"
          className={cn(
            "hidden h-8 w-8 items-center justify-center rounded-lg md:flex",
            notebookIconButton,
          )}
          title={labels.collapseSidebar}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
};

export const LeaveLink = ({
  href,
  label,
  close,
}: {
  href: string;
  label: string;
  close: () => void;
}) => {
  return (
    <div className="px-3 pb-2">
      <Link
        href={href}
        onClick={close}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150",
          notebookNavIdle,
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0 stroke-[2]" />
        {label}
      </Link>
    </div>
  );
};

export const NotebookLinks = ({
  notebooks,
  loading,
  currentId,
  targetFor,
  close,
  emptyLabel,
}: {
  notebooks: readonly SidebarNotebook[];
  loading: boolean;
  currentId?: string;
  targetFor: CreatorSidebarViewProps["notebookTarget"];
  close: () => void;
  emptyLabel: string;
}) => {
  if (loading)
    return (
      <div className="flex flex-col gap-1 px-1 py-1">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="bg-ground h-9 animate-pulse rounded-lg dark:bg-neutral-900"
          />
        ))}
      </div>
    );
  if (notebooks.length === 0)
    return (
      <p className="text-ink-faint px-3 py-2 text-[13px] dark:text-neutral-500">
        {emptyLabel}
      </p>
    );
  return (
    <div className="flex flex-col gap-0.5 py-1">
      {notebooks.map((notebook) => {
        const target = targetFor(notebook.id);
        const className = cn(
          "block truncate rounded-lg px-3 py-2 text-[14px] transition-colors duration-150",
          currentId === notebook.id
            ? notebookNavActive
            : cn(notebookNavIdle, notebookListHover),
        );
        return target.kind === "link" ? (
          <Link
            key={notebook.id}
            href={target.href}
            onClick={close}
            className={className}
            title={notebook.title}
          >
            {notebook.title}
          </Link>
        ) : (
          <div
            key={notebook.id}
            aria-current={currentId === notebook.id ? "page" : undefined}
            className={cn(className, "cursor-default")}
            title={target.description ?? notebook.title}
          >
            {notebook.title}
          </div>
        );
      })}
    </div>
  );
};

export const HistoryLink = ({
  target,
  active,
  label,
  close,
}: {
  target: SidebarTarget;
  active: boolean;
  label: string;
  close: () => void;
}) => {
  const className = (selected: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition-colors duration-150",
      selected ? notebookNavActive : notebookNavIdle,
    );
  const content = (
    <>
      <History className="text-ink-faint h-4 w-4 shrink-0 stroke-[1.75]" />
      {label}
    </>
  );
  return target.kind === "link" ? (
    <Link
      href={target.href}
      onClick={close}
      className={cn(className(active), "shrink-0")}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={target.description}
      className={cn(className(false), "shrink-0 cursor-not-allowed opacity-45")}
    >
      {content}
    </button>
  );
};

export function CreatorSidebarContent({
  props,
}: {
  props: CreatorSidebarViewProps;
}) {
  const close = () => props.onMobileOpenChange(false);
  const handleNewChat = () => {
    close();
    props.onNewChat?.();
  };
  const newChatClass = cn(
    "flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-bold",
    notebookPrimaryButton,
    props.isNewNotebookActive ? "" : "opacity-95",
  );
  const newChatContent = (
    <>
      <Plus className="h-4 w-4 stroke-[2]" />
      {props.t.page.newChat}
    </>
  );
  return (
    <>
      <SidebarHeader
        brand={props.brand}
        labels={props.t.page}
        onDesktopOpenChange={props.onDesktopOpenChange}
      />
      <LeaveLink
        href={props.leaveHref}
        label={props.t.page.leaveNotebook}
        close={close}
      />
      <div className={cn("mx-3 border-b-2", notebookBorder)} aria-hidden />
      <nav className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-4">
        {props.newChatTarget.kind === "client" ? (
          <Link
            href={props.newChatTarget.href}
            onClick={handleNewChat}
            className={newChatClass}
          >
            {newChatContent}
          </Link>
        ) : (
          <a
            href={props.newChatTarget.href}
            onClick={handleNewChat}
            className={newChatClass}
          >
            {newChatContent}
          </a>
        )}
        <HistoryLink
          target={props.historyTarget}
          active={props.isHistoryActive}
          label={props.t.page.historyButton}
          close={close}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-1">
          <div className="no-scrollbar flex-1 overflow-y-auto">
            <NotebookLinks
              notebooks={props.notebooks}
              loading={props.isNotebooksLoading}
              currentId={props.currentNotebookId}
              targetFor={props.notebookTarget}
              close={close}
              emptyLabel={props.t.page.noChats}
            />
          </div>
        </div>
      </nav>
    </>
  );
}
