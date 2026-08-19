"use client";

import { useCallback, useState } from "react";

type UseQATapToAssignOptions<
  TSourceId extends string,
  TTargetId extends string,
> = {
  isReadOnly: boolean;
  isGraded: boolean;
  isSourceAssigned: (sourceId: TSourceId) => boolean;
  isTargetTaken: (targetId: TTargetId) => boolean;
  onAssign: (sourceId: TSourceId, targetId: TTargetId) => void;
};

export function useQATapToAssign<
  TSourceId extends string,
  TTargetId extends string,
>({
  isReadOnly,
  isGraded,
  isSourceAssigned,
  isTargetTaken,
  onAssign,
}: UseQATapToAssignOptions<TSourceId, TTargetId>) {
  const [storedSelectedSourceId, setStoredSelectedSourceId] =
    useState<TSourceId | null>(null);
  const selectedSourceId = isGraded ? null : storedSelectedSourceId;

  const clearSelection = useCallback(() => {
    setStoredSelectedSourceId(null);
  }, []);

  const selectSource = useCallback(
    (sourceId: TSourceId) => {
      if (isReadOnly || isGraded || isSourceAssigned(sourceId)) return;
      setStoredSelectedSourceId((current) =>
        current === sourceId ? null : sourceId,
      );
    },
    [isGraded, isReadOnly, isSourceAssigned],
  );

  const assignToTarget = useCallback(
    (targetId: TTargetId) => {
      if (isReadOnly || isGraded || !storedSelectedSourceId) return;
      if (isTargetTaken(targetId)) return;

      onAssign(storedSelectedSourceId, targetId);
      setStoredSelectedSourceId(null);
    },
    [isGraded, isReadOnly, isTargetTaken, onAssign, storedSelectedSourceId],
  );

  return {
    selectedSourceId,
    selectSource,
    assignToTarget,
    clearSelection,
  };
}
