import { Editor } from "@tiptap/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GUIDE_CHARACTER_NODE_NAME } from "@/shared/content/editor/blocks/guide-character/schema";
import extensions from "@/shared/content/editor/extensions";

import { executeAppendContent, executeInsertContent } from "./editor-commands";

const AUTHOR_HTML = "<p>The author wrote this by hand.</p>";
const GUIDE_HTML = `<div data-type="${GUIDE_CHARACTER_NODE_NAME}"><p>Ready?</p></div>`;

let editors: Editor[] = [];

function makeEditor({
  content = "",
  charLimit = 100_500,
  blockLimit = 12_000,
}: { content?: string; charLimit?: number; blockLimit?: number } = {}) {
  const editor = new Editor({
    extensions: extensions({
      mode: "local",
      charLimit,
      blockLimit,
      userName: "scibly AI",
      mediaUploads: "disabled",
    }),
    content,
  });
  editors.push(editor);
  return editor;
}

const insert = (editor: Editor, html: string) =>
  executeInsertContent({ editor, toolCall: { input: { html } } });

const append = (editor: Editor, html: string) =>
  executeAppendContent({ editor, toolCall: { input: { html } } });

const visible = (editor: Editor) =>
  editor.state.doc.textBetween(0, editor.state.doc.content.size, " ").trim();

beforeEach(() => {
  editors = [];
});

afterEach(() => {
  editors.forEach((editor) => editor.destroy());
});

describe("DW1/DW2 — a write replaces the scene, or leaves it alone", () => {
  it("DW1: replaces hand-authored content wholesale", () => {
    const editor = makeEditor({ content: AUTHOR_HTML });

    const result = insert(editor, "<p>The agent wrote this instead.</p>");

    expect(result.success).toBe(true);
    expect(visible(editor)).toBe("The agent wrote this instead.");
  });

  it("DW1: leaves nothing of the previous content behind when the new content is shorter", () => {
    const editor = makeEditor({
      content: "<p>One.</p><p>Two.</p><p>Three.</p>",
    });

    insert(editor, "<p>Only this.</p>");

    expect(visible(editor)).toBe("Only this.");
  });

  it("DW2: a refused write leaves the previous content intact", () => {
    const editor = makeEditor({ content: AUTHOR_HTML });

    const result = insert(
      editor,
      '<div data-type="quiz"><p>Question</p></div>',
    );

    expect(result.success).toBe(false);
    expect(visible(editor)).toBe("The author wrote this by hand.");
  });
});

describe("DW3 — content the schema cannot represent is refused whole", () => {
  it("DW3: refuses an unknown block type and names it", () => {
    const editor = makeEditor({ content: AUTHOR_HTML });

    const result = insert(
      editor,
      '<div data-type="multiple-choice"><p>Pick one</p></div>',
    );

    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error).toContain("multiple-choice");
  });

  it("DW3: names every unknown block type, so one call fixes them all", () => {
    const editor = makeEditor();

    const result = insert(
      editor,
      '<div data-type="quiz"><p>a</p></div><div data-type="poll"><p>b</p></div>',
    );

    const error = result.success ? "" : result.error;
    expect(error).toContain("quiz");
    expect(error).toContain("poll");
  });

  it("DW3: a block type the schema does know is written", () => {
    const editor = makeEditor();

    const result = insert(editor, GUIDE_HTML);

    expect(result.success).toBe(true);
    expect(editor.getHTML()).toContain(GUIDE_CHARACTER_NODE_NAME);
  });

  it("DW3: plain prose with no custom blocks is written", () => {
    const editor = makeEditor();

    const result = insert(editor, "<p>Just a sentence.</p>");

    expect(result.success).toBe(true);
    expect(visible(editor)).toBe("Just a sentence.");
  });
});

describe("DW4 — a write that renders to nothing clears the scene", () => {
  it("DW4: empty HTML clears the scene", () => {
    const editor = makeEditor({ content: AUTHOR_HTML });

    const result = insert(editor, "");

    expect(result.success).toBe(true);
    expect(visible(editor)).toBe("");
  });

  it("DW4: HTML with no visible text clears the scene", () => {
    const editor = makeEditor({ content: AUTHOR_HTML });

    const result = insert(editor, "<p></p>");

    expect(result.success).toBe(true);
    expect(visible(editor)).toBe("");
  });
});

describe("DW5 — append never removes", () => {
  it("DW5: appended content follows the existing content", () => {
    const editor = makeEditor({ content: "<p>First.</p>" });

    const result = append(editor, "<p>Second.</p>");

    expect(result.success).toBe(true);
    expect(visible(editor)).toBe("First. Second.");
  });

  it("DW5: an empty append is refused rather than treated as a clear", () => {
    const editor = makeEditor({ content: "<p>First.</p>" });

    const result = append(editor, "");

    expect(result.success).toBe(false);
    expect(visible(editor)).toBe("First.");
  });

  it("DW5: a refused append leaves the existing content intact", () => {
    const editor = makeEditor({ content: "<p>First.</p>" });

    const result = append(editor, '<div data-type="quiz"><p>Q</p></div>');

    expect(result.success).toBe(false);
    expect(visible(editor)).toBe("First.");
  });
});

describe("DW6 — a write over the editor's limits is refused, not truncated", () => {
  it("DW6: refuses a write over the character limit and names the limit", () => {
    const editor = makeEditor({ charLimit: 20, content: AUTHOR_HTML });

    const result = insert(editor, `<p>${"x".repeat(21)}</p>`);

    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error).toContain("20");
    expect(visible(editor)).toBe("The author wrote this by hand.");
  });

  it("DW6: refuses a write over the block limit and names the limit", () => {
    const editor = makeEditor({ blockLimit: 3, content: AUTHOR_HTML });

    const result = insert(editor, "<p>a</p><p>b</p><p>c</p><p>d</p>");

    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error).toContain("3");
    expect(visible(editor)).toBe("The author wrote this by hand.");
  });

  it("DW6: a write exactly at the character limit is written", () => {
    const editor = makeEditor({ charLimit: 20 });

    const result = insert(editor, `<p>${"x".repeat(20)}</p>`);

    expect(result.success).toBe(true);
  });

  it("DW6: an append is measured against what the scene already holds, not the new content alone", () => {
    const editor = makeEditor({ charLimit: 20, content: "<p>0123456789</p>" });

    const result = append(editor, "<p>0123456789ABC</p>");

    expect(result.success).toBe(false);
    expect(visible(editor)).toBe("0123456789");
  });

  it("DW6: a replace is measured against the new content alone, since the old is going away", () => {
    const editor = makeEditor({ charLimit: 20, content: "<p>0123456789</p>" });

    const result = insert(editor, "<p>0123456789ABC</p>");

    expect(result.success).toBe(true);
    expect(visible(editor)).toBe("0123456789ABC");
  });
});
