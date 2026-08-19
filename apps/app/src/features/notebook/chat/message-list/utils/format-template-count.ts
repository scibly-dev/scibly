export function formatTemplateCount(template: string, count: number): string {
  return template.replace("{{count}}", String(count));
}
