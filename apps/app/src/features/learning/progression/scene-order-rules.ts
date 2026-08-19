export type SequenceViolation = "SCENE_NOT_FOUND" | "PREVIOUS_SCENE_INCOMPLETE";

export function getSequenceViolation(
  orderedSceneIds: readonly string[],
  completedSceneIds: ReadonlySet<string>,
  targetSceneId: string,
): SequenceViolation | null {
  const targetIndex = orderedSceneIds.indexOf(targetSceneId);
  if (targetIndex < 0) return "SCENE_NOT_FOUND";
  const hasIncompletePredecessor = orderedSceneIds
    .slice(0, targetIndex)
    .some((sceneId) => !completedSceneIds.has(sceneId));
  return hasIncompletePredecessor ? "PREVIOUS_SCENE_INCOMPLETE" : null;
}

export function getContiguousCompletedIndex(
  orderedSceneIds: readonly string[],
  completedSceneIds: ReadonlySet<string>,
): number {
  for (let index = 0; index < orderedSceneIds.length; index++) {
    if (!completedSceneIds.has(orderedSceneIds[index]!)) return index - 1;
  }
  return orderedSceneIds.length - 1;
}

export function isSceneUnlocked(
  orderedSceneIds: readonly string[],
  completedSceneIds: ReadonlySet<string>,
  targetSceneId: string,
): boolean {
  return (
    getSequenceViolation(orderedSceneIds, completedSceneIds, targetSceneId) ===
    null
  );
}
