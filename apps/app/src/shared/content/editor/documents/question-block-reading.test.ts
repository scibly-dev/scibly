import type { JSONContent } from "@tiptap/core";

import { getSchema, Node } from "@tiptap/core";
import { prosemirrorJSONToYDoc } from "@tiptap/y-tiptap";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import {
  extractQuestionBlockSnapshotsFromTipTap,
  normalizeAuthorTipTapContent,
} from "@/shared/content/editor/documents/tiptap-document";
import { extractQuestionBlockSnapshots } from "@/shared/content/editor/documents/yjs-document";

// Asserts the editor's Yjs reader and the publish path's TipTap reader agree
// on whether a scene can be read. Neither reader is doubled.

const schema = getSchema([
  Node.create({ name: "doc", topNode: true, content: "block+" }),
  Node.create({ name: "paragraph", group: "block", content: "text*" }),
  Node.create({ name: "text", group: "inline" }),
  Node.create({
    name: INPUT_FIELD_NODE_NAME,
    group: "block",
    atom: true,
    addAttributes: () => ({
      id: { default: null },
      isQuestionBlock: { default: true },
      questionBlockAttributes: { default: null },
    }),
  }),
]);

const QUESTION_DATA = { answer: "Paris", caseSensitive: false };

function theEditorsForm(): Buffer {
  const content: JSONContent[] = [
    {
      type: INPUT_FIELD_NODE_NAME,
      attrs: {
        id: "b1",
        isQuestionBlock: true,
        questionBlockAttributes: { questionData: QUESTION_DATA },
      },
    },
  ];
  return Buffer.from(
    Y.encodeStateAsUpdate(
      prosemirrorJSONToYDoc(schema, { type: "doc", content }, "default"),
    ),
  );
}

function theLegacySerializedForm(): Buffer {
  return xmlDocumentOf(JSON.stringify({ questionData: QUESTION_DATA }));
}

function attributesNothingCanRead(): Buffer {
  return xmlDocumentOf("Paris, probably");
}

function aQuestionTypeThisBuildDoesNotDefine(): Buffer {
  return xmlDocumentOf(
    JSON.stringify({ questionData: QUESTION_DATA }),
    "custom-riddle",
  );
}

function xmlDocumentOf(
  questionBlockAttributes: string,
  nodeName: string = INPUT_FIELD_NODE_NAME,
): Buffer {
  const document = new Y.Doc();
  const block = new Y.XmlElement(nodeName);
  block.setAttribute("id", "b1");
  block.setAttribute("isQuestionBlock", "true");
  block.setAttribute("questionBlockAttributes", questionBlockAttributes);
  document.getXmlFragment("default").insert(0, [block]);
  return Buffer.from(Y.encodeStateAsUpdate(document));
}

function neverSynchronized(): Buffer {
  return Buffer.from("<p>Half-migrated</p>");
}

type Reading = { read: true; blockIds: string[] } | { read: false };

function readTheWayTheEditorDoes(documentState: Buffer): Reading {
  try {
    return {
      read: true,
      blockIds: extractQuestionBlockSnapshots(documentState).map(
        (block) => block.blockId,
      ),
    };
  } catch {
    return { read: false };
  }
}

function readTheWayPublishingDoes(documentState: Buffer): Reading {
  try {
    return {
      read: true,
      blockIds: extractQuestionBlockSnapshotsFromTipTap(
        normalizeAuthorTipTapContent(documentState),
      ).map((block) => block.blockId),
    };
  } catch {
    return { read: false };
  }
}

describe("SOL17: both readers give the same document the same answer", () => {
  it.each<[string, () => Buffer]>([
    ["the attributes the editor writes", theEditorsForm],
    ["the older serialized attributes", theLegacySerializedForm],
    ["attributes nothing can read", attributesNothingCanRead],
    [
      "a question type this build does not define",
      aQuestionTypeThisBuildDoesNotDefine,
    ],
    ["a scene never synchronized to the editor", neverSynchronized],
    ["a document state that is not a document", () => Buffer.from([7, 7, 7])],
    ["no document at all", () => Buffer.alloc(0)],
  ])("%s", (_case, document) => {
    const state = document();

    expect(readTheWayTheEditorDoes(state)).toEqual(
      readTheWayPublishingDoes(state),
    );
  });

  it("and a question the editor wrote is read by both, so agreeing is not both refusing", () => {
    const state = theEditorsForm();

    expect(readTheWayTheEditorDoes(state)).toEqual({
      read: true,
      blockIds: ["b1"],
    });
    expect(readTheWayPublishingDoes(state)).toEqual({
      read: true,
      blockIds: ["b1"],
    });
  });

  it("the older serialized form is still a readable question, not a broken scene", () => {
    expect(readTheWayPublishingDoes(theLegacySerializedForm())).toEqual({
      read: true,
      blockIds: ["b1"],
    });
  });
});

describe("SOL22: a question type this build does not define", () => {
  const state = aQuestionTypeThisBuildDoesNotDefine();

  it("is refused rather than read as a question", () => {
    expect(readTheWayTheEditorDoes(state)).toEqual({ read: false });
    expect(readTheWayPublishingDoes(state)).toEqual({ read: false });
  });

  it.each<[string, (documentState: Buffer) => unknown]>([
    ["the editor's reader", extractQuestionBlockSnapshots],
    [
      "publishing's reader",
      (documentState) =>
        extractQuestionBlockSnapshotsFromTipTap(
          normalizeAuthorTipTapContent(documentState),
        ),
    ],
  ])("names the type it could not read — %s", (_reader, read) => {
    expect(() => read(state)).toThrow(/custom-riddle/);
    expect(() => read(state)).toThrow(/b1/);
  });
});
