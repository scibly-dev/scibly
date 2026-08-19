import type { Editor } from "@tiptap/react";
import type {
  HtmlAttribute,
  HtmlItem,
  HtmlSchemaAwarenessContext,
} from "@/shared/content/editor/html-schema/types.d";

import { callOrReturn, getExtensionField } from "@tiptap/core";

function collectSchemaItems(editor: Editor): Map<string, HtmlItem> {
  const items = new Map<string, HtmlItem>();
  const extensions = editor.extensionManager?.extensions;

  if (!extensions) {
    return items;
  }

  for (const extension of extensions) {
    const ctx: HtmlSchemaAwarenessContext<null> = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
      parent: null,
    };

    const rawField = getExtensionField<(() => HtmlItem) | HtmlItem | undefined>(
      extension,
      "addHtmlSchemaAwareness",
      ctx,
    );

    if (!rawField) continue;

    const item = callOrReturn(rawField, ctx);

    if (item && typeof item === "object" && "tag" in item && "name" in item) {
      items.set(extension.name, item);
    }
  }

  return items;
}

function renderAttributeMarkdown(attr: HtmlAttribute): string {
  const lines: string[] = [];

  lines.push(`#### \`${attr.attr}\``);
  lines.push("");

  if (attr.value !== undefined) {
    lines.push(`- \`value\`: \`${JSON.stringify(attr.value)}\``);
    lines.push("");
  }

  if (attr.description) {
    lines.push(attr.description);
    lines.push("");
  }

  return lines.join("\n");
}

function renderItemMarkdown(item: HtmlItem): string {
  const lines: string[] = [];

  lines.push(`## ${item.name}`);
  lines.push("");
  lines.push(`- \`tag\`: \`${item.tag}\``);
  lines.push("");

  if (item.description) {
    lines.push(item.description);
    lines.push("");
  }

  if (item.attributes && item.attributes.length > 0) {
    lines.push("### Attributes");
    lines.push("");
    for (const attr of item.attributes) {
      lines.push(renderAttributeMarkdown(attr));
    }
  }

  return lines.join("\n");
}
const SCHEMA_PREAMBLE = `# RICH TEXT DOCUMENT SCHEMA (STRICT MODE)

You are generating a STRICTLY VALID HTML subset for a custom rich text editor.

## CRITICAL RULES (HARD CONSTRAINTS)
These rules override everything else:

1. OUTPUT MUST BE VALID SCHEMA HTML ONLY
   - You may ONLY use tags listed in this schema.
   - Any tag NOT explicitly listed is FORBIDDEN (e.g. <b>, <div data-type="document">, <style>, <table>).
   - If unsure, OMIT the element entirely.

2. ROOT ELEMENT RULE
   - The entire output MUST be wrapped in exactly one:
     <div>
   - Do NOT add attributes to the root element.

3. NO UNAUTHORIZED ATTRIBUTES
   - Only use attributes explicitly defined in the schema.
   - Never add custom attributes like "style", "class" (unless explicitly allowed), or "data-type" unless specified.

4. NO MARKDOWN OR NON-HTML
   - Output must be raw HTML only.
   - No explanations, no backticks, no markdown.

5. NO BANNED PATTERNS
   You MUST NEVER use:
   - <b> (use <strong>)
   - <i> (use <em>)
   - inline style=""
   - arbitrary div wrappers like data-type="document"

6. QUESTION BLOCK INTEGRITY
   - NEVER insert user answers, scores, or points into question blocks.
   - Leave user answer fields empty.

7. STRUCTURAL CONSISTENCY
   - Column layouts must contain exactly two <div data-type="column"> children.
   - Lists must only contain <li> children.

## OUTPUT VALIDATION MENTAL CHECK (DO BEFORE RESPONDING)
Before final output, verify:
- [ ] Only allowed tags used
- [ ] Exactly one root <div>
- [ ] No forbidden attributes
- [ ] No markdown or code fences
- [ ] No <b>, <i>, or <style>
- [ ] No extra wrapper like "document"
- [ ] All structured components are complete

## RECOVERY RULE
If a required element cannot be expressed using the schema:
→ OMIT IT completely (do not substitute invalid HTML)

These are the elements that the HTML document can contain:`;

function renderSchemaMarkdown(items: Map<string, HtmlItem>): string {
  if (items.size === 0) return SCHEMA_PREAMBLE;

  const values = Array.from(items.values());
  const docIndex = values.findIndex((item) => item.name === "Document");
  if (docIndex > -1) {
    const [docItem] = values.splice(docIndex, 1);
    values.unshift(docItem);
  }

  const sections = values.map((item) => renderItemMarkdown(item));

  const elementList = sections.map((s) => `---\n\n${s}\n`).join("\n") + "\n---";

  return `${SCHEMA_PREAMBLE}\n\n${elementList}`;
}

interface AiToolkit {
  getHtmlSchemaAwareness(
    customItems?: Array<{ extensionName: string } & HtmlItem>,
  ): string;
}

export function getAiToolkit(editor: Editor): AiToolkit {
  return {
    getHtmlSchemaAwareness(customItems = []) {
      const items = collectSchemaItems(editor);

      for (const { extensionName, ...item } of customItems) {
        items.set(extensionName, item);
      }

      return renderSchemaMarkdown(items);
    },
  };
}
