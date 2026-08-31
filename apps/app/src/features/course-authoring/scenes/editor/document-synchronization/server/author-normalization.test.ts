import { Editor, getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";
import { authorNormalizationPlugins } from "@/shared/content/editor/documents/author-normalization";

import {
  normalizeAuthorDocument,
  parseSceneHtml,
  sceneSchema,
} from "./scene-html";

const schemaExtensions = editorSchemaRegistry.materializeSchemaExtensions({});

/** The document an author would end up with, typing the same content. */
function authoredByEditor(html: string) {
  const editor = new Editor({ extensions: schemaExtensions });
  editor.commands.setContent(html);
  const json = editor.state.doc.toJSON();
  editor.destroy();
  return json;
}

/** The document the headless writer produces, replacing an empty scene. */
function writtenHeadlessly(html: string) {
  const empty = sceneSchema().topNodeType.createAndFill()!;
  return normalizeAuthorDocument(empty, parseSceneHtml(html)).toJSON();
}

describe("normalizeAuthorDocument", () => {
  it("derives a steps block's questionData the way the editor does", () => {
    const editor = new Editor({ extensions: schemaExtensions });
    editor.commands.insertSteps();
    const authored = editor.getHTML();
    editor.destroy();

    const headless = writtenHeadlessly(authored);
    expect(headless).toEqual(authoredByEditor(authored));

    // ...and it really is derived, not merely equal because neither touched it.
    const steps = (
      headless as {
        content: {
          type: string;
          attrs: Record<string, { questionData: unknown }>;
        }[];
      }
    ).content.find((node) => node.type === "steps");
    expect(steps?.attrs.questionBlockAttributes.questionData).toEqual({
      stepCount: 3,
      firstEmptyStep: 1,
    });
  });

  it("leaves plain content alone", () => {
    const html = "<p>Written by the agent</p>";
    expect(writtenHeadlessly(html)).toEqual(authoredByEditor(html));
  });

  // Hand-written pin because TipTap only assembles plugins through an `Editor`
  // (which needs a DOM): when this fails, a new plugin that derives content
  // from content belongs in `authorNormalizationPlugins`.
  it("pins the named plugins the editor installs", () => {
    const editor = new Editor({ extensions: schemaExtensions });
    const named = (plugins: readonly { spec: { key?: unknown } }[]) =>
      plugins
        .map((plugin) =>
          String((plugin.spec.key as { key?: string })?.key ?? ""),
        )
        .filter(Boolean)
        .map((key) => key.replace(/\$.*$/, ""))
        .sort();
    const keys = named(editor.state.plugins);
    editor.destroy();

    expect(keys).toEqual([
      "autolink",
      "clearDocument",
      "clipboardTextSerializer",
      "clozeSync",
      "codeBlockVSCodeHandler",
      "editable",
      "focusEvents",
      "handleClickLink",
      "handlePasteLink",
      "stepsSync",
      "tabindex",
      "textDirection",
      "tiptapDrop",
      "tiptapPaste",
      "uniqueID",
    ]);
    // every derivation plugin the writer runs is one the editor runs
    expect(
      named(authorNormalizationPlugins(getSchema(schemaExtensions))),
    ).toEqual(["clozeSync", "stepsSync"]);
  });
});
