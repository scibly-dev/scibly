"use client";

import { useEffect } from "react";

export function useEnsureValidSelection<T extends { id: string }>({
  items,
  activeId,
  setActive,
  enabled = true,
}: {
  items: readonly T[];
  activeId: string | undefined;
  setActive: (item: T | undefined) => void;
  enabled?: boolean;
}): void {
  useEffect(() => {
    if (!enabled) return;

    if (items.length === 0) {
      if (activeId !== undefined) setActive(undefined);
      return;
    }

    const isSelectionValid = items.some((item) => item.id === activeId);
    if (!isSelectionValid) {
      setActive(items[0]);
    }
  }, [items, activeId, setActive, enabled]);
}
