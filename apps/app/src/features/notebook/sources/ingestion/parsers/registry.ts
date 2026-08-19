import type { DocumentParser, ParseResult } from "./types";

export class DocumentParserRegistry {
  private readonly parsers = new Map<string, DocumentParser>();

  register(sourceType: string, parser: DocumentParser): this {
    this.parsers.set(sourceType, parser);
    return this;
  }

  async parse(sourceType: string, buffer: Buffer): Promise<ParseResult> {
    const parser = this.parsers.get(sourceType);
    if (!parser) {
      throw new Error(
        `[DocumentParserRegistry] No parser registered for source type "${sourceType}". ` +
          `Known types: ${[...this.parsers.keys()].join(", ")}`,
      );
    }
    return parser.parse(buffer);
  }
}
