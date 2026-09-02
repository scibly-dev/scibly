import { AppError } from "@scibly/api/application-error";

/** The SDK hands a thrown error's message to the calling agent, so internal failures are logged here and replaced. */
export async function readable<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AppError && error.code !== "INTERNAL_SERVER_ERROR") {
      throw error;
    }
    console.error(`[mcp] ${label} failed:`, error);
    throw new Error("Scibly could not be reached. Try again.");
  }
}

export function text(output: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(output) }] };
}
