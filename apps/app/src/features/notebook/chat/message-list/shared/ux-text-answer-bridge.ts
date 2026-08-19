// Routes composer text to the on-screen question card: the composer can't build the answer itself, only the card knows what's selected; one handler per tool call, and it returns false once unmounted so the composer can fall back instead of swallowing the input.
type UxTextAnswerHandler = (text: string) => boolean;

const handlers = new Map<string, UxTextAnswerHandler>();

export function registerUxTextAnswerHandler(
  toolCallId: string,
  handler: UxTextAnswerHandler,
): () => void {
  handlers.set(toolCallId, handler);
  return () => {
    if (handlers.get(toolCallId) === handler) handlers.delete(toolCallId);
  };
}

export function deliverUxTextAnswer(toolCallId: string, text: string): boolean {
  const handler = handlers.get(toolCallId);
  if (!handler) return false;
  return handler(text);
}

export function resetUxTextAnswerHandlers(): void {
  handlers.clear();
}
