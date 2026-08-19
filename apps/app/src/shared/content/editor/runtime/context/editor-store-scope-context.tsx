"use client";

import { createContext, type ReactNode, use } from "react";

/**
 * When false, question blocks and the store editor ref must not update the global
 * lesson-player store (e.g. exiting AnimatePresence panels still mounted).
 */
const EditorStoreScopeContext = createContext(true);

export function EditorStoreScopeProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <EditorStoreScopeContext value={active}>{children}</EditorStoreScopeContext>
  );
}

export function useEditorStoreScopeActive() {
  return use(EditorStoreScopeContext);
}
