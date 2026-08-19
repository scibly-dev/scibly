import type { DocumentParser, ParseResult } from "./types";

export class TextParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParseResult> {
    return { text: buffer.toString("utf-8").trim() };
  }
}
