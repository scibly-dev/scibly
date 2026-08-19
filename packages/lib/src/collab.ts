export class CollabDocument {
  public readonly sceneId: string;

  constructor(public readonly documentName: string) {
    this.sceneId = documentName;
  }

  static parse(documentName: string) {
    return new CollabDocument(documentName);
  }
}

export const COLLAB_METADATA_MAP_NAME = "metadata";
export const COLLAB_INITIAL_HTML_KEY = "initialHtml";

// Backslash-escaped JSON in questionblock-data is a common LLM output mistake; unescape it to single-quoted JSON.
const sanitizeQuestionBlockAttributes = (html: string): string => {
  return html.replace(
    /questionblock-data="(\{[\s\S]*?\})"/g,
    (match, jsonStr) => {
      const unescaped = jsonStr.replace(/\\"/g, '"');
      return `questionblock-data='${unescaped}'`;
    },
  );
};

export const encodeHtmlBytes = (html: string): Uint8Array => {
  const sanitized = sanitizeQuestionBlockAttributes(html);
  const encoded = new TextEncoder().encode(sanitized);
  const arr = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(arr).set(encoded);
  return new Uint8Array(arr);
};
