export type ByoaiProviderPresetId =
  | "custom"
  | "openai"
  | "anthropic"
  | "gemini";

interface ByoaiProviderPreset {
  id: ByoaiProviderPresetId;
  label: string;
  baseUrl: string;
  apiKeyPlaceholder: string;
  modelIdPlaceholder: string;
}

export function isManagedByoaiPreset(presetId: ByoaiProviderPresetId): boolean {
  return presetId !== "custom";
}

export function resolveByoaiPresetBaseUrl(
  presetId: ByoaiProviderPresetId,
): string {
  return getByoaiProviderPreset(presetId).baseUrl;
}

export const BYOAI_PROVIDER_PRESETS: readonly ByoaiProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKeyPlaceholder: "sk-…",
    modelIdPlaceholder: "gpt-4o-mini",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyPlaceholder: "sk-ant-…",
    modelIdPlaceholder: "claude-sonnet-4-6",
  },
  {
    id: "gemini",
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKeyPlaceholder: "AIza…",
    modelIdPlaceholder: "gemini-2.5-flash",
  },
  {
    id: "custom",
    label: "Custom",
    baseUrl: "",
    apiKeyPlaceholder: "",
    modelIdPlaceholder: "",
  },
] as const;

export function getByoaiProviderPreset(
  id: ByoaiProviderPresetId,
): ByoaiProviderPreset {
  return (
    BYOAI_PROVIDER_PRESETS.find((preset) => preset.id === id) ??
    BYOAI_PROVIDER_PRESETS[BYOAI_PROVIDER_PRESETS.length - 1]!
  );
}
