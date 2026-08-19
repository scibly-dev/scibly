"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { useState } from "react";

import { PagePickerBreadcrumbs } from "./page-picker-breadcrumbs";
import { PagePickerFooter } from "./page-picker-footer";
import { PagePickerList } from "./page-picker-list";
import { PagePickerSearchBar } from "./page-picker-search-bar";
import { PagePickerSelectAllBar } from "./page-picker-select-all-bar";
import {
  useLinkSelectedPages,
  usePagePickerNavigation,
  usePagePickerPages,
  usePagePickerSelection,
} from "./use-page-picker-controller";

export interface BreadcrumbEntry {
  id: string;
  title: string;
  nodeType: "page" | "database";
}

export interface PagePickerContentProps {
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  orgSlug: string;
  provider: IntegrationProviderId;
  totalSourceCount: number;

  sourceLimit: number;
  alreadyLinkedIds: Set<string>;
  t: NotebookTranslations["sources"]["pagePicker"];
  onLinked: () => void;
}

export const PagePickerBody = ({
  props,
  remaining,
  query,
  setQuery,
  navigation,
  pageState,
  selection,
  linking,
}: {
  props: PagePickerContentProps;
  remaining: number;
  query: string;
  setQuery: (query: string) => void;
  navigation: ReturnType<typeof usePagePickerNavigation>;
  pageState: ReturnType<typeof usePagePickerPages>;
  selection: ReturnType<typeof usePagePickerSelection>;
  linking: ReturnType<typeof useLinkSelectedPages>;
}) => {
  return (
    <>
      <PagePickerBreadcrumbs
        breadcrumbs={navigation.breadcrumbs}
        isFetching={pageState.isFetching}
        isLoading={pageState.isLoading}
        t={props.t}
        onNavigate={navigation.navigateTo}
      />
      <PagePickerSearchBar
        query={query}
        isSearching={pageState.isSearching}
        t={props.t}
        onChange={setQuery}
      />
      {!pageState.isLoading && selection.selectablePages.length > 0 ? (
        <PagePickerSelectAllBar
          selectablePages={selection.selectablePages}
          selected={selection.selected}
          totalSourceCount={props.totalSourceCount}
          sourceLimit={props.sourceLimit}
          allVisibleSelected={selection.allVisibleSelected}
          t={props.t}
          onToggleSelectAll={selection.toggleSelectAll}
        />
      ) : null}
      <PagePickerList
        pages={pageState.pages}
        selected={selection.selected}
        remaining={remaining}
        isLoading={pageState.isLoading}
        isSearching={pageState.isSearching}
        alreadyLinkedIds={props.alreadyLinkedIds}
        t={props.t}
        onToggle={selection.togglePage}
        onDrillInto={navigation.drillInto}
      />
      <PagePickerFooter
        pages={pageState.pages}
        selected={selection.selected}
        isLoading={pageState.isLoading}
        isPending={linking.isPending}
        t={props.t}
        onClearSelection={() => selection.setSelected(new Set())}
        onCancel={() => props.onOpenChange(false)}
        onAdd={linking.add}
      />
    </>
  );
};

export function PagePickerContent({
  onOpenChange,
  notebookId,
  orgSlug,
  provider,
  totalSourceCount,
  sourceLimit,
  alreadyLinkedIds,
  t,
  onLinked,
}: PagePickerContentProps) {
  const props = {
    onOpenChange,
    notebookId,
    orgSlug,
    provider,
    totalSourceCount,
    sourceLimit,
    alreadyLinkedIds,
    t,
    onLinked,
  };
  const remaining = Math.max(0, sourceLimit - totalSourceCount);
  const [query, setQuery] = useState("");
  const navigation = usePagePickerNavigation(setQuery);
  const pageState = usePagePickerPages(orgSlug, provider, query, navigation);
  const selection = usePagePickerSelection(
    pageState.pages,
    alreadyLinkedIds,
    remaining,
  );
  const linking = useLinkSelectedPages(
    props,
    pageState.pages,
    selection.selected,
  );
  return (
    <PagePickerBody
      props={props}
      remaining={remaining}
      query={query}
      setQuery={setQuery}
      navigation={navigation}
      pageState={pageState}
      selection={selection}
      linking={linking}
    />
  );
}
