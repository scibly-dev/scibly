"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { createContext, useContext } from "react";

export type InsertGeneratedImageLabels = Pick<
  NotebookTranslations["chat"]["imageGeneration"],
  | "insertIntoScene"
  | "insertError"
  | "noCourseLinked"
  | "openCourseBuilder"
  | "chooseSceneTitle"
  | "chooseSceneDescription"
  | "insertedIntoScene"
>;

interface GeneratedImageActionsContextValue {
  insert: (url: string, alt: string) => Promise<boolean>;
  download: (args: {
    url: string;
    alt: string;
    imageId?: string;
  }) => Promise<void>;
  isDownloading: (key: string) => boolean;
  insertLabels: InsertGeneratedImageLabels;
}

export const GeneratedImageActionsContext =
  createContext<GeneratedImageActionsContextValue | null>(null);

export function useGeneratedImageActions(): GeneratedImageActionsContextValue {
  const value = useContext(GeneratedImageActionsContext);
  if (!value) {
    throw new Error(
      "useGeneratedImageActions must be used within GeneratedImageActionsProvider",
    );
  }
  return value;
}
