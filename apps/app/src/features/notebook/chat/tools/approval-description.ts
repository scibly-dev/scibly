const APPROVAL_TOOL_DESCRIPTION_SUFFIX =
  "The chat UI shows a confirmation card — do not ask the user to confirm in plain text. " +
  "Call this tool when the action is appropriate; the UI handles approval. " +
  "After the user approves and the tool returns its result, read the output and briefly tell the user what happened. " +
  "Do not call the same tool again in the same turn unless the result indicates failure or missing IDs to retry.";

export function buildApprovalToolDescription(
  specificDescription: string,
): string {
  const trimmed = specificDescription.trim();
  if (!trimmed.endsWith(".")) {
    return `${trimmed}. ${APPROVAL_TOOL_DESCRIPTION_SUFFIX}`;
  }
  return `${trimmed} ${APPROVAL_TOOL_DESCRIPTION_SUFFIX}`;
}
