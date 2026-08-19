"use client";

import * as React from "react";

interface CourseStatsCardProps {
  title: string;
  value: React.ReactNode;
  valueSuffix?: string;
  footerLabel: string;
  footerValue: React.ReactNode;
}

export function CourseStatsCard({
  title,
  value,
  valueSuffix,
  footerLabel,
  footerValue,
}: CourseStatsCardProps) {
  return (
    <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-2 text-[11px] font-medium tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
        {title}
      </p>
      <div className="flex items-end justify-center gap-1">
        {value}
        {valueSuffix && (
          <span className="mb-0.5 text-base text-neutral-400">
            {valueSuffix}
          </span>
        )}
      </div>
      <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
        <p className="mb-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          {footerLabel}
        </p>
        {footerValue}
      </div>
    </div>
  );
}
