interface ModelDefinition {
  readonly id: string;

  readonly label: string;

  readonly description: string;

  readonly providerLabel: string;
}

const BYOAI_MODEL_PREFIX = "byoai:" as const;

export const byoaiModelId = (id: string): string =>
  `${BYOAI_MODEL_PREFIX}${id}`;

export const parseByoaiId = (modelId: string): string | null =>
  modelId.startsWith(BYOAI_MODEL_PREFIX)
    ? modelId.slice(BYOAI_MODEL_PREFIX.length)
    : null;

export const DEFAULT_MODEL_ID = "scibly/default" as const;

export const SCIBLY_MODEL: ModelDefinition = {
  id: DEFAULT_MODEL_ID,
  label: "Scibly AI",
  description: "Optimized for course creation and learning design",
  providerLabel: "Scibly",
};

/**
 * True only for a model id we actually offer — an invented `scibly/pro` must
 * not silently fall back to the default model.
 */
export const isOfferedSciblyModelId = (modelId: string): boolean =>
  modelId === DEFAULT_MODEL_ID;
