import { type NotebookTranslations } from "../i18n/notebook.types";

// Called server-side only — a client-side Math.random() index would mismatch during hydration.
export function pickGreeting(t: NotebookTranslations, name: string): string {
  const greetings = t.page.greetings;
  const idx = Math.floor(Math.random() * greetings.length);
  const template = greetings[idx] ?? greetings[0] ?? "{name}";
  return template.replace("{name}", name || "there");
}
