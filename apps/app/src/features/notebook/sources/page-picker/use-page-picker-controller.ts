"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { RouterOutputs } from "@/shared/api/trpc/client";
import type {
  BreadcrumbEntry,
  PagePickerContentProps,
} from "./page-picker-content";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { api } from "@/shared/api/trpc/client";

export type PageItem =
  RouterOutputs["integration"]["searchPages"]["pages"][number];

export function usePagePickerNavigation(setQuery: (query: string) => void) {
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentNodeType, setParentNodeType] = useState<"page" | "database">(
    "page",
  );
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);
  const drillInto = useCallback(
    (page: PageItem) => {
      const nodeType = page.isDatabase
        ? ("database" as const)
        : ("page" as const);
      setBreadcrumbs((previous) => [
        ...previous,
        { id: page.id, title: page.title, nodeType },
      ]);
      setParentId(page.id);
      setParentNodeType(nodeType);
      setQuery("");
    },
    [setQuery],
  );
  const navigateTo = useCallback(
    (index: number) => {
      if (index === -1) {
        setBreadcrumbs([]);
        setParentId(null);
        setParentNodeType("page");
        return;
      }
      const crumb = breadcrumbs[index];
      if (!crumb) return;
      setBreadcrumbs((previous) => previous.slice(0, index + 1));
      setParentId(crumb.id);
      setParentNodeType(crumb.nodeType);
    },
    [breadcrumbs],
  );
  return { parentId, parentNodeType, breadcrumbs, drillInto, navigateTo };
}

export function usePagePickerPages(
  orgSlug: string,
  provider: IntegrationProviderId,
  query: string,
  navigation: ReturnType<typeof usePagePickerNavigation>,
) {
  const [debouncedQuery] = useDebounce(query, 400);
  const isSearching = navigation.parentId === null;
  const search = api.integration.searchPages.useQuery(
    { orgSlug, provider, query: debouncedQuery },
    { enabled: isSearching },
  );
  const children = api.integration.listPageChildren.useQuery(
    {
      orgSlug,
      provider,
      pageId: navigation.parentId!,
      nodeType: navigation.parentNodeType,
    },
    {
      enabled: !isSearching && navigation.parentId !== null,
      staleTime: 30_000,
    },
  );
  const active = isSearching ? search : children;
  const rawPages = useMemo<PageItem[]>(
    () => active.data?.pages ?? [],
    [active.data],
  );
  const pages = useMemo(() => {
    if (isSearching || !query.trim()) return rawPages;
    const normalized = query.toLowerCase();
    return rawPages.filter((page) =>
      page.title.toLowerCase().includes(normalized),
    );
  }, [isSearching, query, rawPages]);
  return {
    pages,
    isSearching,
    isLoading: active.isLoading,
    isFetching: active.isFetching,
  };
}

export function usePagePickerSelection(
  pages: PageItem[],
  linked: Set<string>,
  remaining: number,
) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectablePages = useMemo(
    () => pages.filter((page) => !page.isDatabase && !linked.has(page.id)),
    [linked, pages],
  );
  const allVisibleSelected =
    selectablePages.length > 0 &&
    selectablePages.every((page) => selected.has(page.id));
  const togglePage = useCallback(
    (pageId: string) => {
      setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(pageId)) next.delete(pageId);
        else if (next.size < remaining) next.add(pageId);
        return next;
      });
    },
    [remaining],
  );
  const toggleSelectAll = useCallback(() => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected)
        selectablePages.forEach((page) => next.delete(page.id));
      else
        for (const page of selectablePages) {
          if (next.size >= remaining) break;
          next.add(page.id);
        }
      return next;
    });
  }, [allVisibleSelected, remaining, selectablePages]);
  return {
    selected,
    setSelected,
    selectablePages,
    allVisibleSelected,
    togglePage,
    toggleSelectAll,
  };
}

export function useLinkSelectedPages(
  props: PagePickerContentProps,
  pages: PageItem[],
  selected: Set<string>,
) {
  const pageMapRef = useRef<Map<string, PageItem>>(new Map());
  useEffect(() => {
    pages.forEach((page) => pageMapRef.current.set(page.id, page));
  }, [pages]);
  const mutation = api.integration.linkPages.useMutation({
    onSuccess: (result) => {
      const count = result.sourceIds.length;
      if (count > 0) {
        toast.success(
          result.skipped > 0
            ? `${count} page${count !== 1 ? "s" : ""} added (${result.skipped} already linked)`
            : `${count} page${count !== 1 ? "s" : ""} added successfully`,
        );
        props.onLinked();
        props.onOpenChange(false);
      } else
        toast.info("All selected pages are already linked to this notebook.");
    },
    onError: (error) => toast.error(error.message ?? props.t.failedToLink),
  });
  const add = useCallback(() => {
    const selectedPages = [...selected].flatMap((id) => {
      const page = pageMapRef.current.get(id);
      return page ? [page] : [];
    });
    if (selectedPages.length === 0) return;
    mutation.mutate({
      notebookId: props.notebookId,
      orgSlug: props.orgSlug,
      provider: props.provider,
      pages: selectedPages.map((page) => ({
        id: page.id,
        title: page.title,
        url: page.url,
      })),
    });
  }, [mutation, props.notebookId, props.orgSlug, props.provider, selected]);
  return { add, isPending: mutation.isPending };
}
