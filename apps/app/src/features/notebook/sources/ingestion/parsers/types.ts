export interface ParseResult {
  text: string;
  pageCount?: number;
}

export interface DocumentParser {
  parse(buffer: Buffer): Promise<ParseResult>;
}
