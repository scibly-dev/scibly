import "@tiptap/core";

declare module "@tiptap/markdown" {
  export interface MarkdownExtensionStorage {
    getMarkdown: () => string;
  }
}
