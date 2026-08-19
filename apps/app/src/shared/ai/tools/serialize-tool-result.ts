export function serializeToolResult<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  // SAFETY: the round trip only rewrites what a model could not have read

  return JSON.parse(JSON.stringify(value)) as T;
}
