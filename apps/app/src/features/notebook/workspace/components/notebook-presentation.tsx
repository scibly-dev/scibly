"use client";

import { createContext, use } from "react";

type NotebookPresentation =
  | {
      type: "production";
      editor: "collaborative";
      imageEditor: "enabled";
      mediaUploads: "enabled";
    }
  | {
      type: "showcase";
      editor: "local";
      imageEditor: "hidden";
      mediaUploads: "disabled";
    };

const productionNotebookPresentation = {
  type: "production",
  editor: "collaborative",
  imageEditor: "enabled",
  mediaUploads: "enabled",
} as const satisfies NotebookPresentation;

const showcaseNotebookPresentation = {
  type: "showcase",
  editor: "local",
  imageEditor: "hidden",
  mediaUploads: "disabled",
} as const satisfies NotebookPresentation;

const NotebookPresentationContext = createContext<NotebookPresentation | null>(
  null,
);

const NotebookPresentationProviderComponent = ({
  presentation,
  children,
}: {
  presentation: NotebookPresentation;
  children: React.ReactNode;
}) => {
  return (
    <NotebookPresentationContext.Provider value={presentation}>
      {children}
    </NotebookPresentationContext.Provider>
  );
};

export function ProductionNotebookPresentation({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotebookPresentationProviderComponent
      presentation={productionNotebookPresentation}
    >
      {children}
    </NotebookPresentationProviderComponent>
  );
}

export function ShowcaseNotebookPresentation({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotebookPresentationProviderComponent
      presentation={showcaseNotebookPresentation}
    >
      {children}
    </NotebookPresentationProviderComponent>
  );
}

export function useNotebookPresentation(): NotebookPresentation {
  const presentation = use(NotebookPresentationContext);
  if (!presentation) {
    throw new Error(
      "useNotebookPresentation must be used inside a notebook presentation",
    );
  }
  return presentation;
}
