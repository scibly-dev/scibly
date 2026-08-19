import type { NotebookMessage } from "@/features/notebook/chat/contracts";

export type ChatTurn = {
  userMessage?: NotebookMessage;
  assistantMessage?: NotebookMessage;
  id: string;
};

function turnId({
  userMessage,
  assistantMessage,
}: {
  userMessage?: NotebookMessage;
  assistantMessage?: NotebookMessage;
}): string {
  if (userMessage && assistantMessage) {
    return `turn:${userMessage.id}:${assistantMessage.id}`;
  }
  if (userMessage) return `turn:user:${userMessage.id}`;
  if (assistantMessage) return `turn:assistant:${assistantMessage.id}`;
  return "turn:empty";
}

export function groupMessagesIntoTurns(
  messages: NotebookMessage[],
): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let current: ChatTurn | null = null;

  messages.forEach((msg) => {
    if (msg.role === "user") {
      const orphanAssistantTurn = turns.at(-1);
      if (
        orphanAssistantTurn?.assistantMessage &&
        !orphanAssistantTurn.userMessage &&
        !current
      ) {
        orphanAssistantTurn.userMessage = msg;
        orphanAssistantTurn.id = turnId(orphanAssistantTurn);
        return;
      }

      if (current) turns.push(current);
      current = { userMessage: msg, id: turnId({ userMessage: msg }) };
      return;
    }

    if (msg.role === "assistant") {
      if (current) {
        current.assistantMessage = msg;
        current.id = turnId(current);
        turns.push(current);
        current = null;
      } else {
        turns.push({
          assistantMessage: msg,
          id: turnId({ assistantMessage: msg }),
        });
      }
    }
  });

  if (current) turns.push(current);
  return turns;
}
