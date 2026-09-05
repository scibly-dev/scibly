import { quoteSourceName } from "@/features/notebook/sources/server/source-passage";

interface UiContext {
  orgSlug: string;
  course?: { id: string; title: string };
  lesson?: { id: string; title: string };
  scene?: { id: string; title: string };
  authoringRules: string;
}

export function uiContextSection({
  orgSlug,
  course,
  lesson,
  scene,
  authoringRules,
}: UiContext): string {
  const lines = ["## Current focus", "", `- Organization: \`${orgSlug}\``];

  if (course) {
    lines.push(`- Course: ${quoteSourceName(course.title)} (\`${course.id}\`)`);
  }
  if (lesson) {
    lines.push(`- Lesson: ${quoteSourceName(lesson.title)} (\`${lesson.id}\`)`);
  }
  if (scene) {
    lines.push(
      `- Scene: ${quoteSourceName(scene.title)} (\`${scene.id}\`) — actively open in the editor`,
    );
  }

  if (course) {
    lines.push(
      "",
      "Use these IDs for tool calls tied to the user's workspace. Load `scene-content` when creating or editing scene content.",
      "",
      authoringRules,
    );
  } else {
    lines.push(
      "",
      "Use the organization slug when calling tools that require it.",
    );
  }

  return lines.join("\n");
}
