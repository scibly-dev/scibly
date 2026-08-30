import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { findEmptyStep } from "@/shared/content/editor/blocks/steps/schema";
import {
  STEP_NODE_NAME,
  STEPS_NODE_NAME,
} from "@/shared/content/editor/blocks/steps/schema";
import extensions from "@/shared/content/editor/extensions";

let editors: Editor[] = [];

function makeEditor(content = "") {
  const editor = new Editor({
    extensions: extensions({
      mode: "local",
      charLimit: 100_500,
      blockLimit: 12_000,
      userName: "author",
      mediaUploads: "disabled",
    }),
    content,
  });
  editors.push(editor);
  return editor;
}

function stepLabels(editor: Editor) {
  const labels: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === STEP_NODE_NAME) {
      labels.push(node.textContent);
    }
  });
  return labels;
}

function stepsCount(editor: Editor) {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === STEPS_NODE_NAME) count += 1;
  });
  return count;
}

const THREE_STEPS =
  '<div data-type="steps">' +
  '<div data-type="step"><p>one</p></div>' +
  '<div data-type="step"><p>two</p></div>' +
  '<div data-type="step"><p>three</p></div>' +
  "</div>";

afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors = [];
});

describe("steps commands", () => {
  it("inserts a block that already has steps to fill", () => {
    const editor = makeEditor();
    editor.commands.insertSteps();

    expect(stepsCount(editor)).toBe(1);
    expect(stepLabels(editor)).toEqual(["", "", ""]);
  });

  it("adds a step after the one holding the selection", () => {
    const editor = makeEditor(THREE_STEPS);

    editor.commands.setTextSelection(4);

    expect(editor.commands.addStep()).toBe(true);
    expect(stepLabels(editor)).toEqual(["one", "", "two", "three"]);
  });

  it("adds a step at an explicit position, as the block's add button does", () => {
    const editor = makeEditor(THREE_STEPS);
    const stepsNode = editor.state.doc.firstChild!;

    editor.commands.addStep(stepsNode.nodeSize - 1);

    expect(stepLabels(editor)).toEqual(["one", "two", "three", ""]);
  });

  it("removes the addressed step and keeps the rest", () => {
    const editor = makeEditor(THREE_STEPS);
    const secondStepPos = 1 + editor.state.doc.firstChild!.firstChild!.nodeSize;

    editor.commands.removeStep(secondStepPos);

    expect(stepLabels(editor)).toEqual(["one", "three"]);
    expect(stepsCount(editor)).toBe(1);
  });

  it("removes the whole block when its last step goes", () => {
    const editor = makeEditor(
      '<div data-type="steps"><div data-type="step"><p>only</p></div></div>',
    );

    editor.commands.removeStep(1);

    expect(stepsCount(editor)).toBe(0);
  });

  it("counts opened steps from the top and never walks backwards", () => {
    const editor = makeEditor(THREE_STEPS);
    const stepsNode = editor.state.doc.firstChild!;
    const firstStepPos = 1;
    const secondStepPos = firstStepPos + stepsNode.firstChild!.nodeSize;

    const opened = () =>
      editor.state.doc.firstChild!.attrs.questionBlockAttributes.userAnswers;

    expect(editor.commands.openStep(firstStepPos)).toBe(true);
    expect(opened()).toBe(1);

    expect(editor.commands.openStep(secondStepPos)).toBe(true);
    expect(opened()).toBe(2);

    expect(editor.commands.openStep(firstStepPos)).toBe(false);
    expect(opened()).toBe(2);
  });

  it("refuses to open a node that is not a step", () => {
    const editor = makeEditor("<p>plain</p>");

    expect(editor.commands.openStep(0)).toBe(false);
  });

  it("re-parses its own HTML back into the same steps", () => {
    const editor = makeEditor(THREE_STEPS);

    const reloaded = makeEditor(editor.getHTML());

    expect(stepsCount(reloaded)).toBe(1);
    expect(stepLabels(reloaded)).toEqual(["one", "two", "three"]);
  });

  it("does nothing when the selection is outside a steps block", () => {
    const editor = makeEditor("<p>plain</p>");

    expect(editor.commands.addStep()).toBe(false);
    expect(editor.commands.removeStep()).toBe(false);
  });
});

// An empty step opens onto nothing, so publishing refuses it — see
// StepsParser.describeMissingSolution.
describe("empty steps", () => {
  const block = (editor: Editor) => editor.state.doc.firstChild!;

  it("passes a block whose steps all have something in them", () => {
    expect(findEmptyStep(block(makeEditor(THREE_STEPS)))).toBeNull();
  });

  it("reports the first step left blank, by position", () => {
    const editor = makeEditor(
      '<div data-type="steps">' +
        '<div data-type="step"><p>one</p></div>' +
        '<div data-type="step"><p>  </p></div>' +
        '<div data-type="step"><p></p></div>' +
        "</div>",
    );

    expect(findEmptyStep(block(editor))).toBe(2);
  });

  it("counts a step carrying only media as filled", () => {
    const editor = makeEditor(
      '<div data-type="steps">' +
        '<div data-type="step"><img src="https://example.com/a.png" /></div>' +
        "</div>",
    );

    expect(findEmptyStep(block(editor))).toBeNull();
  });

  it("counts a step whose only text is its label as empty", () => {
    const editor = makeEditor(
      '<div data-type="steps">' +
        '<div data-type="step" data-label="1969"><p></p></div>' +
        "</div>",
    );

    expect(findEmptyStep(block(editor))).toBe(1);
  });
});

// The parser only ever sees questionData, so it has to track the doc.
describe("questionData sync", () => {
  const questionData = (editor: Editor) =>
    editor.state.doc.firstChild!.attrs.questionBlockAttributes.questionData;

  it("describes a freshly inserted block as three empty steps", () => {
    const editor = makeEditor();
    editor.commands.insertSteps();

    expect(questionData(editor)).toEqual({ stepCount: 3, firstEmptyStep: 1 });
  });

  it("recounts on every edit, not just when steps are added", () => {
    const editor = makeEditor(THREE_STEPS);

    editor.commands.addStep(editor.state.doc.firstChild!.nodeSize - 1);
    expect(questionData(editor)).toEqual({ stepCount: 4, firstEmptyStep: 4 });

    editor.commands.insertContent("four");
    expect(questionData(editor)).toEqual({
      stepCount: 4,
      firstEmptyStep: null,
    });
  });
});
