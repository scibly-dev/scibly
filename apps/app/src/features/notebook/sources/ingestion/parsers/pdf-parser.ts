import type { TextResult } from "pdf-parse";
import type { DocumentParser, ParseResult } from "./types";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { AppError } from "@scibly/api/application-error";
import { PDFParse, VerbosityLevel } from "pdf-parse";
import { CanvasFactory, getData } from "pdf-parse/worker";

import "pdf-parse/worker";

const PDF_PAGE_MARKER = /^-- \d+ of \d+ --$/;
const MIN_TEXT_LENGTH = 8;

const PDF_NO_TEXT_ERROR =
  "No text could be extracted from this PDF. The file may store pages as images " +
  "(e.g. jsPDF exports), use unsupported fonts, or be password-protected. " +
  "Try re-exporting with a text layer or paste the content as plain text.";

let workerReady = false;

function ensurePdfWorker(): void {
  if (workerReady) return;
  PDFParse.setWorker(getData());
  workerReady = true;
}

// Don't use require.resolve here — Next.js can replace it with a numeric
// module id in production, causing "path must be of type string" errors.
function getPdfJsAssetUrl(subdir: string): string | undefined {
  try {
    const pdfjsRoot = path.dirname(
      fileURLToPath(import.meta.resolve("pdfjs-dist/package.json")),
    );
    return `${path.join(pdfjsRoot, subdir)}/`;
  } catch {
    return undefined;
  }
}

function createPdfParser(buffer: Buffer): PDFParse {
  const standardFontDataUrl = getPdfJsAssetUrl("standard_fonts");
  const cMapUrl = getPdfJsAssetUrl("cmaps");

  const fontOptions =
    standardFontDataUrl && cMapUrl
      ? {
          CanvasFactory,
          standardFontDataUrl,
          cMapUrl,
          cMapPacked: true as const,
          useSystemFonts: true as const,
        }
      : {};

  return new PDFParse({
    data: Uint8Array.from(buffer),
    verbosity: VerbosityLevel.ERRORS,
    ...fontOptions,
  });
}

function collectText(result: TextResult): string {
  const fromPages = result.pages
    .map((page) => page.text.trim())
    .filter(Boolean)
    .join("\n\n");

  if (fromPages) return fromPages;

  return result.text
    .split("\n")
    .filter((line) => !PDF_PAGE_MARKER.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export class PdfParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParseResult> {
    ensurePdfWorker();

    const parser = createPdfParser(buffer);

    try {
      const result = await parser.getText({ pageJoiner: "" });
      const text = collectText(result);

      if (text.replace(/\s+/g, "").length < MIN_TEXT_LENGTH) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "source.pdf_has_no_text",
          message: PDF_NO_TEXT_ERROR,
        });
      }

      return { text, pageCount: result.total };
    } finally {
      await parser.destroy();
    }
  }
}
