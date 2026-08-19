"use client";

import type { Locale } from "@scibly/i18n/constants";
import type { CourseFrequency, OverviewTab } from "../../overview-data";

import {
  chipActiveClass,
  chipClass,
  chipRestClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { useState } from "react";

import { MarketingSection } from "@/app/[lang]/components/marketing-section-content";

import { CourseCardItem } from "./components/course-card-item";

interface UseCasesTabsProps {
  locale: Locale;
  tabs: OverviewTab[];
  slugLabel: string;
  frequencyLabels: Record<CourseFrequency, string>;
}

export function UseCasesTabs({
  locale,
  tabs,
  slugLabel,
  frequencyLabels,
}: UseCasesTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <MarketingSection top="flush">
      {/* Tab bar */}
      <div className="mb-9 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              chipClass,
              tab.id === activeTab ? chipActiveClass : chipRestClass,
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {currentTab && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentTab.cards.map((card) => (
            <CourseCardItem
              key={card.name}
              card={card}
              locale={locale}
              slugLabel={slugLabel}
              frequencyLabels={frequencyLabels}
            />
          ))}
        </div>
      )}
    </MarketingSection>
  );
}
