import { SOURCE_TYPES } from "@/shared/content/sources/constants";

import { PdfParser } from "./pdf-parser";
import { DocumentParserRegistry } from "./registry";
import { TextParser } from "./text-parser";

export const documentParserRegistry = new DocumentParserRegistry()
  .register(SOURCE_TYPES.PDF, new PdfParser())
  .register(SOURCE_TYPES.TEXT, new TextParser());
