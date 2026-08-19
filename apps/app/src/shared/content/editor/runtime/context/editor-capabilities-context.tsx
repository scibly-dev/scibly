"use client";

import { createContext, use } from "react";

export type EditorCapabilities = {
  mediaUploads?: "enabled" | "disabled";
};

type ResolvedEditorCapabilities = {
  mediaUploads: "enabled" | "disabled";
};

const DEFAULT_EDITOR_CAPABILITIES: ResolvedEditorCapabilities = {
  mediaUploads: "enabled",
};

const EditorCapabilitiesContext = createContext<ResolvedEditorCapabilities>(
  DEFAULT_EDITOR_CAPABILITIES,
);

export function resolveEditorCapabilities(
  capabilities: EditorCapabilities | undefined,
): ResolvedEditorCapabilities {
  return {
    mediaUploads: capabilities?.mediaUploads ?? "enabled",
  };
}

export function EditorCapabilitiesProvider({
  value,
  children,
}: {
  value?: EditorCapabilities;
  children: React.ReactNode;
}) {
  return (
    <EditorCapabilitiesContext.Provider
      value={resolveEditorCapabilities(value)}
    >
      {children}
    </EditorCapabilitiesContext.Provider>
  );
}

export function useEditorCapabilities(): ResolvedEditorCapabilities {
  return use(EditorCapabilitiesContext);
}
